"use client";

import { useState, useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase-client";

function SaveEnvCopy({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(`export CLAWSETUPS_API_KEY="${apiKey}"`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="px-2 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors whitespace-nowrap"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function AgentInstructionCopy({ keyPrefix }: { keyPrefix: string }) {
  const [copied, setCopied] = useState(false);
  void keyPrefix; // key is stored as env var, not passed in message
  const text = `Submit my OpenClaw setup to claw-setups.vercel.app.\nUse the key saved as CLAWSETUPS_API_KEY in my workspace.\nRead my SOUL.md and AGENTS.md to fill in the details.`;
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-2 right-2 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

interface KeyInfo {
  hasKey: boolean;
  keyRecord: {
    keyPrefix: string;
    createdAt: string;
    lastUsedAt: string | null;
    submissionCount: number;
    xUsername: string | null;
    xVerified: boolean;
    xVerifyCode: string | null;
  } | null;
  twitterLinked: boolean;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
}

export default function DashboardPage() {
  const [session, setSession] = useState<null | { user: { email?: string } }>(null);
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [linking, setLinking] = useState(false);
  const [verifyCode, setVerifyCode] = useState<string | null>(null);
  const [xHandleInput, setXHandleInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  // Submit form
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitDesc, setSubmitDesc] = useState("");
  const [submitModel, setSubmitModel] = useState("anthropic/claude-sonnet-4-6");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ok: boolean; message: string; url?: string} | null>(null);


  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchKeyInfo();
      else setLoading(false);
    });
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="text-4xl">&#x1F6A7;</div>
        <h1 className="text-3xl font-bold">Dashboard coming soon</h1>
        <p className="text-zinc-400 max-w-md mx-auto">
          Supabase setup is pending. The API key portal will be available once configuration is complete.
        </p>
      </div>
    );
  }

  async function fetchKeyInfo() {
    setLoading(true);
    const res = await fetch("/api/dashboard/key-info");
    if (res.ok) {
      const data = await res.json();

      // Also check client-side identities (catches cases where server session lags)
      let twitterLinked = data.twitterLinked;
      if (!twitterLinked) {
        const supabase = createClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          twitterLinked = !!(user?.identities?.some((id) => id.provider === "twitter"));
        }
      }

      if (twitterLinked && data.keyRecord && !data.keyRecord.xVerified) {
        const verifyRes = await fetch("/api/dashboard/verify-x", { method: "POST" });
        if (verifyRes.ok) {
          const freshRes = await fetch("/api/dashboard/key-info");
          if (freshRes.ok) {
            setKeyInfo(await freshRes.json());
            setLoading(false);
            return;
          }
        }
      }
      setKeyInfo({ ...data, twitterLinked });
    }
    setLoading(false);
  }

  async function signInWithGitHub() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
  }

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setKeyInfo(null);
    setNewKey(null);
  }

  async function generateKey() {
    if (!confirm("This will revoke your existing key. Continue?")) return;
    setGenerating(true);
    setNewKey(null);
    const res = await fetch("/api/dashboard/generate-key", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      setNewKey(data.key);
      await fetchKeyInfo();
    }
    setGenerating(false);
  }

  async function revokeKey() {
    if (!confirm("Revoke your API key? This cannot be undone.")) return;
    setRevoking(true);
    await fetch("/api/dashboard/revoke-key", { method: "POST" });
    setNewKey(null);
    await fetchKeyInfo();
    setRevoking(false);
  }

  async function startXVerify() {
    setLinking(true);
    setVerifyError(null);
    const res = await fetch("/api/dashboard/x-code", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      setVerifyCode(data.code);
    } else {
      setVerifyError("Failed to generate code. Try again.");
    }
    setLinking(false);
  }

  async function submitSetup() {
    if (!submitTitle.trim() || !submitDesc.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    const res = await fetch("/api/dashboard/submit-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: submitTitle.trim(),
        description: submitDesc.trim(),
        model: submitModel,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setSubmitResult({ ok: true, message: "Submitted! Your setup will appear in the gallery in ~60 seconds.", url: data.prUrl });
      setSubmitTitle("");
      setSubmitDesc("");
      await fetchKeyInfo();
    } else {
      setSubmitResult({ ok: false, message: data.error || "Submission failed." });
    }
    setSubmitting(false);
  }

  async function completeXVerify() {
    if (!verifyCode || !xHandleInput.trim()) return;
    setVerifying(true);
    setVerifyError(null);
    const res = await fetch("/api/dashboard/x-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xUsername: xHandleInput.trim(), code: verifyCode }),
    });
    const data = await res.json();
    if (data.ok) {
      setVerifyCode(null);
      setXHandleInput("");
      await fetchKeyInfo();
    } else {
      setVerifyError(data.error || "Verification failed. Make sure you posted the tweet.");
    }
    setVerifying(false);
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-[#E8404A] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // Not signed in
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="text-4xl">&#x1F511;</div>
        <h1 className="text-3xl font-bold">Get your API Key</h1>
        <p className="text-zinc-400 max-w-md mx-auto">
          Sign in with GitHub to generate an API key. Your agent can then submit setups to
          the community gallery automatically.
        </p>
        <button
          onClick={signInWithGitHub}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </button>
        <p className="text-xs text-zinc-600">
          Free. No credit card required.
        </p>
      </div>
    );
  }

  // Signed in
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {keyInfo?.user?.avatar && (
            <img src={keyInfo.user.avatar} alt="" className="w-10 h-10 rounded-full" />
          )}
          <div>
            <p className="font-semibold">{keyInfo?.user?.name || "Agent Developer"}</p>
            <p className="text-sm text-zinc-500">@{keyInfo?.user?.username}</p>
          </div>
        </div>
        <button onClick={signOut} className="text-sm text-zinc-500 hover:text-white transition-colors">
          Sign out
        </button>
      </div>

      {/* New key banner (shown only once) */}
      {newKey && (
        <div className="rounded-lg border border-green-800 bg-green-950/50 p-4 space-y-4">
          <div className="flex items-center gap-2 text-green-400 font-medium">
            <span>✅</span>
            <span>API key generated — save it now, shown only once</span>
          </div>
          {/* Key copy */}
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-zinc-900 rounded px-3 py-2 text-sm font-mono text-green-300 break-all">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy key"}
            </button>
          </div>
          {/* Save instruction */}
          <div className="space-y-2">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Save to your workspace (run in terminal)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-950 rounded px-3 py-1.5 text-xs font-mono text-zinc-400 border border-zinc-800">
                export CLAWSETUPS_API_KEY=&quot;{newKey}&quot;
              </code>
              <SaveEnvCopy apiKey={newKey} />
            </div>
            <p className="text-xs text-zinc-600">
              Add this to your <code className="text-zinc-500">~/.zshrc</code> or <code className="text-zinc-500">~/.bashrc</code> to persist. Then your agent will find it automatically.
            </p>
          </div>
        </div>
      )}

      {/* Current key status */}
      <div className="rounded-lg border border-zinc-800 p-6 space-y-4">
        <h2 className="font-semibold text-lg">API Key</h2>
        {keyInfo?.hasKey && keyInfo.keyRecord ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Key prefix</p>
                <code className="font-mono text-zinc-300">{keyInfo.keyRecord.keyPrefix}</code>
              </div>
              <div>
                <p className="text-zinc-500">Created</p>
                <p className="text-zinc-300">{new Date(keyInfo.keyRecord.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-zinc-500">Last used</p>
                <p className="text-zinc-300">{keyInfo.keyRecord.lastUsedAt ? new Date(keyInfo.keyRecord.lastUsedAt).toLocaleDateString() : "Never"}</p>
              </div>
              <div>
                <p className="text-zinc-500">Submissions</p>
                <p className="text-zinc-300">{keyInfo.keyRecord.submissionCount}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={generateKey}
                disabled={generating}
                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {generating ? "Rotating..." : "Rotate Key"}
              </button>
              <button
                onClick={revokeKey}
                disabled={revoking}
                className="px-4 py-2 text-sm text-red-400 border border-red-900 hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50"
              >
                {revoking ? "Revoking..." : "Revoke Key"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">No API key yet. Generate one to start submitting setups.</p>
            <button
              onClick={generateKey}
              disabled={generating}
              className="px-4 py-2 text-sm bg-[#E8404A] hover:bg-[#d63840] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate API Key"}
            </button>
          </div>
        )}
      </div>

      {/* X Verification */}
      <div className="rounded-lg border border-zinc-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">X (Twitter) Verification</h2>
          {keyInfo?.keyRecord?.xVerified && (
            <span className="flex items-center gap-1 text-xs text-blue-400 border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 rounded-full font-medium">
              ✓ Verified
            </span>
          )}
        </div>

        {keyInfo?.keyRecord?.xVerified && keyInfo.keyRecord.xUsername ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Verified as{" "}
              <a href={`https://x.com/${keyInfo.keyRecord.xUsername}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                @{keyInfo.keyRecord.xUsername}
              </a>
            </p>

            {/* Next step CTA */}
            <div className="rounded-lg bg-[#E8404A]/5 border border-[#E8404A]/20 p-4 space-y-3">
              <p className="text-sm font-medium text-white">🎯 You&apos;re all set. Now publish your first setup!</p>
              <p className="text-xs text-zinc-400">
                Your agent can submit a config to the public gallery in 60 seconds:
              </p>
              <pre className="bg-zinc-900 rounded p-3 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">{`curl -X POST https://claw-setups.vercel.app/api/agent-submit \\
  -H "Authorization: Bearer ${keyInfo.keyRecord.keyPrefix}..." \\
  -H "Content-Type: application/json" \\
  -d '{"title":"My Agent Setup","model":"claude-sonnet-4-6","description":"...","config":{}}'`}</pre>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/for-agents"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#E8404A] hover:bg-[#d63840] text-white rounded-lg transition-colors font-medium"
                >
                  Full API docs →
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Just verified my X account on ClawSetups.dev 🦞 Now publishing AI agent setups to the community gallery!\nhttps://claw-setups.vercel.app #OpenClaw #AIAgents")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </a>
              </div>
            </div>
          </div>
        ) : verifyCode ? (
          /* Step 2: Tweet the code, then enter username */
          <div className="space-y-4">
            <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Step 1 — Post this tweet</p>
              <p className="text-sm text-zinc-200 font-mono leading-relaxed">
                Verifying my claw-setups.vercel.app setup: {verifyCode}
              </p>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Verifying my claw-setups.vercel.app setup: ${verifyCode}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-black hover:bg-zinc-900 border border-zinc-700 text-white rounded-lg transition-colors mt-1"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Open tweet
              </a>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Step 2 — Enter your @username</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="@yourusername"
                  value={xHandleInput}
                  onChange={(e) => setXHandleInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8404A]/50"
                />
                <button
                  onClick={completeXVerify}
                  disabled={verifying || !xHandleInput.trim()}
                  className="px-4 py-2 text-sm bg-[#E8404A] hover:bg-[#d63840] text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {verifying ? "Checking..." : "Verify"}
                </button>
              </div>
              {verifyError && <p className="text-xs text-red-400">{verifyError}</p>}
              <button onClick={() => setVerifyCode(null)} className="text-xs text-zinc-600 hover:text-zinc-400">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Step 0: Start verification */
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Verify your X identity with a tweet — no OAuth needed. Your setups get a verified badge.
            </p>
            <button
              onClick={startXVerify}
              disabled={!keyInfo?.hasKey || linking}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {linking ? "Generating..." : "Verify with X"}
            </button>
            {!keyInfo?.hasKey && (
              <p className="text-xs text-zinc-600">Generate an API key first.</p>
            )}
          </div>
        )}
      </div>

      {/* Publish via agent */}
      {keyInfo?.hasKey && (
        <div className="rounded-lg border border-zinc-800 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Publish a Setup</h2>

          {submitResult ? (
            <div className={`rounded-lg p-4 space-y-2 ${submitResult.ok ? "bg-green-950/50 border border-green-800" : "bg-red-950/50 border border-red-900"}`}>
              <p className={`text-sm font-medium ${submitResult.ok ? "text-green-400" : "text-red-400"}`}>
                {submitResult.ok ? "✅" : "❌"} {submitResult.message}
              </p>
              {submitResult.url && (
                <a href={submitResult.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-white underline block">View PR →</a>
              )}
              <button onClick={() => setSubmitResult(null)} className="text-xs text-zinc-600 hover:text-zinc-400 block">Publish another</button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Recommended: agent instruction */}
              <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🤖</span>
                  <span className="text-sm font-medium text-white">Tell your agent (recommended)</span>
                </div>
                <p className="text-xs text-zinc-500">Just say this to Ace, Mia, or any OpenClaw agent:</p>
                <div className="relative">
                  <pre className="bg-zinc-950 rounded-lg p-3 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words font-sans border border-zinc-800">{`Submit my OpenClaw setup to claw-setups.vercel.app.
Use the key saved as CLAWSETUPS_API_KEY in my workspace.
Read my SOUL.md and AGENTS.md to fill in the details.`}</pre>
                  <AgentInstructionCopy keyPrefix={keyInfo.keyRecord?.keyPrefix ?? ""} />
                </div>
                <p className="text-xs text-zinc-600">Save your key first (see below), then send this to your agent.</p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-600">or fill manually</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Manual form */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Setup title"
                  value={submitTitle}
                  onChange={(e) => setSubmitTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8404A]/50"
                />
                <textarea
                  placeholder="What does this setup do?"
                  value={submitDesc}
                  onChange={(e) => setSubmitDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#E8404A]/50 resize-none"
                />
                <select
                  value={submitModel}
                  onChange={(e) => setSubmitModel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-[#E8404A]/50"
                >
                  <option value="anthropic/claude-sonnet-4-6">claude-sonnet-4-6</option>
                  <option value="anthropic/claude-opus-4-5">claude-opus-4-5</option>
                  <option value="anthropic/claude-haiku-3-5">claude-haiku-3-5</option>
                  <option value="openai/gpt-4o">gpt-4o</option>
                  <option value="openai/gpt-4o-mini">gpt-4o-mini</option>
                </select>
                <button
                  onClick={submitSetup}
                  disabled={submitting || !submitTitle.trim() || !submitDesc.trim()}
                  className="w-full py-2.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish to Gallery"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
