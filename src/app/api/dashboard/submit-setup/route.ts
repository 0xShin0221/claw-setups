import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { getUserKey, recordKeyUsage } from "@/lib/keyStore";
import { slugify } from "@/lib/slugify";
import { scanAndRedact } from "@/lib/secretScan";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keyRecord = await getUserKey(user.id);
  if (!keyRecord) return NextResponse.json({ error: "No API key found. Generate one first." }, { status: 403 });

  const body = await req.json();
  const { title, description, model, useCase, channels } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }

  const cleanTitle = title.trim().slice(0, 200);
  const cleanDescription = description.trim().slice(0, 200);
  const cleanModel = model || "anthropic/claude-sonnet-4-6";
  const cleanUseCase = useCase || "general";
  const cleanChannels = channels || ["discord"];
  const slug = slugify(cleanTitle);

  // Scan for secrets
  const configText = JSON.stringify({ model: cleanModel });
  const configScan = scanAndRedact(configText);

  const token = (process.env.GITHUB_TOKEN || "").trim();
  const repo = (process.env.GITHUB_REPO || "0xShin0221/claw-setups").trim();
  if (!token) return NextResponse.json({ error: "Server config error" }, { status: 500 });

  const [owner, repoName] = repo.split("/");
  const octokit = new Octokit({ auth: token });
  const branchName = `dashboard/${slug}-${Date.now()}`;

  const setupData = {
    id: slug,
    title: cleanTitle,
    description: cleanDescription,
    author: {
      name: keyRecord.githubUsername,
      github: keyRecord.githubUsername,
      ...(keyRecord.xVerified && keyRecord.xUsername ? { xUsername: keyRecord.xUsername, xVerified: true } : {}),
    },
    model: cleanModel,
    channels: cleanChannels,
    useCase: cleanUseCase,
    skills: [],
    config: JSON.parse(configScan.text),
    likes: 0,
    createdAt: new Date().toISOString().split("T")[0],
  };

  const { data: refData } = await octokit.git.getRef({ owner, repo: repoName, ref: "heads/main" });
  await octokit.git.createRef({ owner, repo: repoName, ref: `refs/heads/${branchName}`, sha: refData.object.sha });
  await octokit.repos.createOrUpdateFileContents({
    owner, repo: repoName,
    path: `data/setups/${slug}.json`,
    message: `feat: add setup "${cleanTitle}" by @${keyRecord.githubUsername}`,
    content: Buffer.from(JSON.stringify(setupData, null, 2)).toString("base64"),
    branch: branchName,
  });

  const { data: pr } = await octokit.pulls.create({
    owner, repo: repoName,
    title: `setup: ${cleanTitle}`,
    body: `Submitted via dashboard by @${keyRecord.githubUsername}${keyRecord.xVerified ? ` ✓ @${keyRecord.xUsername} on X` : ""}`,
    head: branchName, base: "main",
  });

  try {
    await octokit.issues.addLabels({ owner, repo: repoName, issue_number: pr.number, labels: ["agent-submission", "auto-merge"] });
  } catch { /* labels may not exist yet */ }

  await recordKeyUsage(user.id);

  return NextResponse.json({ ok: true, slug, prUrl: pr.html_url });
}
