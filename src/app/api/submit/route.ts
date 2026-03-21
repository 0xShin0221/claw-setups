import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { slugify } from "@/lib/slugify";
import { scanAndRedact } from "@/lib/secretScan";

// --- Rate limiting (in-memory, resets on deploy) ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5; // per IP per day

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => t > dayAgo);
  rateLimitMap.set(ip, timestamps);
  return timestamps.length < RATE_LIMIT;
}

function recordRequest(ip: string) {
  const timestamps = rateLimitMap.get(ip) || [];
  timestamps.push(Date.now());
  rateLimitMap.set(ip, timestamps);
}

// --- Validation helpers ---
const XSS_PATTERNS = [/<script/i, /javascript:/i, /data:text\/html/i, /on\w+\s*=/i];

function containsXSS(text: string): boolean {
  return XSS_PATTERNS.some((p) => p.test(text));
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

function checkJsonDepth(obj: unknown, maxDepth: number, current = 0): boolean {
  if (current > maxDepth) return false;
  if (obj && typeof obj === "object") {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (!checkJsonDepth(value, maxDepth, current + 1)) return false;
    }
  }
  return true;
}

// --- POST handler ---
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 5 submissions per day." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { title, description, useCase, channels, model, skills, configText, soulMd, agentsMd } = body;

    // Required fields
    if (!title || !description || !useCase || !model || !configText) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, useCase, model, configText" },
        { status: 400 }
      );
    }

    // Length limits
    if (title.length > 200 || description.length > 200) {
      return NextResponse.json(
        { error: "Title and description must be 200 characters or less." },
        { status: 400 }
      );
    }

    // XSS check on text fields
    const textFields = [title, description, useCase, soulMd || "", agentsMd || ""];
    for (const field of textFields) {
      if (containsXSS(field)) {
        return NextResponse.json(
          { error: "Input contains disallowed content (script tags or event handlers)." },
          { status: 400 }
        );
      }
    }

    // Config size limit (100KB)
    if (new TextEncoder().encode(configText).length > 100 * 1024) {
      return NextResponse.json(
        { error: "Configuration JSON exceeds 100KB limit." },
        { status: 400 }
      );
    }

    // Parse and validate config JSON
    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(configText);
    } catch {
      return NextResponse.json(
        { error: "Configuration is not valid JSON." },
        { status: 400 }
      );
    }

    if (!checkJsonDepth(parsedConfig, 10)) {
      return NextResponse.json(
        { error: "Configuration JSON exceeds maximum nesting depth of 10." },
        { status: 400 }
      );
    }

    // Server-side secret scan on configText
    const configScan = scanAndRedact(configText);
    if (configScan.secretsFound > 0) {
      parsedConfig = JSON.parse(configScan.text);
    }

    // Also scan markdown fields
    const soulMdClean = soulMd ? scanAndRedact(soulMd).text : "";
    const agentsMdClean = agentsMd ? scanAndRedact(agentsMd).text : "";

    // Sanitize text fields
    const cleanTitle = stripHtml(title).trim();
    const cleanDescription = stripHtml(description).trim();

    // GitHub PR creation
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO || "0xShin0221/claw-setups";

    if (!token) {
      return NextResponse.json(
        { error: "Server configuration error: GitHub token not set." },
        { status: 500 }
      );
    }

    const [owner, repoName] = repo.split("/");
    const octokit = new Octokit({ auth: token });
    const slug = slugify(cleanTitle);
    const branchName = `community/${slug}`;

    // Get default branch SHA
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: "heads/main",
    });
    const baseSha = refData.object.sha;

    // Create branch
    try {
      await octokit.git.createRef({
        owner,
        repo: repoName,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });
    } catch (e: unknown) {
      const err = e as { status?: number };
      if (err.status === 422) {
        // Branch already exists, append timestamp
        const uniqueBranch = `${branchName}-${Date.now()}`;
        await octokit.git.createRef({
          owner,
          repo: repoName,
          ref: `refs/heads/${uniqueBranch}`,
          sha: baseSha,
        });
        // Use the unique branch name going forward
        return await createPRWithBranch(octokit, owner, repoName, uniqueBranch, {
          slug: `${slug}-${Date.now()}`,
          cleanTitle,
          cleanDescription,
          useCase,
          channels: channels || [],
          model,
          skills: skills || [],
          parsedConfig,
          soulMdClean,
          agentsMdClean,
          ip,
        });
      }
      throw e;
    }

    return await createPRWithBranch(octokit, owner, repoName, branchName, {
      slug,
      cleanTitle,
      cleanDescription,
      useCase,
      channels: channels || [],
      model,
      skills: skills || [],
      parsedConfig,
      soulMdClean,
      agentsMdClean,
      ip,
    });
  } catch (error: unknown) {
    console.error("Submit error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to create PR: ${message}` }, { status: 500 });
  }
}

interface PRParams {
  slug: string;
  cleanTitle: string;
  cleanDescription: string;
  useCase: string;
  channels: string[];
  model: string;
  skills: string[];
  parsedConfig: Record<string, unknown>;
  soulMdClean: string;
  agentsMdClean: string;
  ip: string;
}

async function createPRWithBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  params: PRParams
) {
  const {
    slug, cleanTitle, cleanDescription, useCase, channels,
    model, skills, parsedConfig, soulMdClean, agentsMdClean, ip,
  } = params;

  const setupData = {
    id: slug,
    title: cleanTitle,
    description: cleanDescription,
    author: "community",
    useCase,
    channels,
    model,
    skills,
    stars: 0,
    forks: 0,
    downloads: 0,
    verified: false,
    tags: [],
    config: parsedConfig,
    workspaceFiles: {
      "SOUL.md": soulMdClean,
      "AGENTS.md": agentsMdClean,
    },
    createdAt: new Date().toISOString(),
  };

  // Create file in branch
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: `data/setups/${slug}.json`,
    message: `feat: add community setup - ${cleanTitle}`,
    content: Buffer.from(JSON.stringify(setupData, null, 2)).toString("base64"),
    branch,
  });

  // Ensure label exists
  try {
    await octokit.issues.createLabel({
      owner,
      repo,
      name: "community-submission",
      color: "E8404A",
      description: "Community-submitted setup configuration",
    });
  } catch {
    // Label already exists, ignore
  }

  // Create PR
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `feat: add community setup - ${cleanTitle}`,
    body: `## Community Setup Submission\n\n**Title:** ${cleanTitle}\n**Description:** ${cleanDescription}\n**Use Case:** ${useCase}\n**Model:** ${model}\n**Channels:** ${channels.join(", ") || "none"}\n**Skills:** ${skills.join(", ") || "none"}\n\n---\n\n> This setup was submitted via the community form and will undergo automated + manual review before merging.`,
    head: branch,
    base: "main",
    labels: ["community-submission"],
  });

  // Add label to PR (pulls.create doesn't always support labels)
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: pr.number,
    labels: ["community-submission"],
  });

  recordRequest(ip);

  return NextResponse.json({
    ok: true,
    prUrl: pr.html_url,
    slug,
  });
}
