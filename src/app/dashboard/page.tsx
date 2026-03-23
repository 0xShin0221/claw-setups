"use client";

import { useState, useEffect } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase-client";

interface KeyInfo {
  hasKey: boolean;
  keyRecord: {
    keyPrefix: string;
    createdAt: string;
    lastUsedAt: string | null;
    submissionCount: number;
    xUsername: string | null;
    xVerified: boolean;
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
      if (data.twitterLinked && data.keyRecord && !data.keyRecord.xVerified) {
        const verifyRes = await fetch("/api/dashboard/verify-x", { method: "POST" });
        if (verifyRes.ok) {
          const freshRes = await fetch("/api/dashboard/key-info");
          if (freshRes.ok) {
            const freshData = await freshRes.json();
            setKeyInfo(freshData);
            setLoading(false);
            return;
          }
        }
      }
      setKeyInfo(data);
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

  async function linkXAccount() {
    const supabase = createClient();
    if (!supabase) return;
    setLinking(true);
    const { error } = await supabase.auth.linkIdentity({
      provider: "twitter",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      console.error("Twitter link error:", error);
      alert(`X連携エラー: ${error.message}`);
      setLinking(false);
    }
    // No error = redirect to Twitter OAuth is happening
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
        <div className="rounded-lg border border-green-800 bg-green-950/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-400 font-medium">
            <span>&#x2705;</span>
            <span>Your API key — save this now, it will not be shown again</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-zinc-900 rounded px-3 py-2 text-sm font-mono text-green-300 break-all">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
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
        <h2 className="font-semibold text-lg">X (Twitter) Verification</h2>
        {keyInfo?.keyRecord?.xVerified && keyInfo.keyRecord.xUsername ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">
              Verified as <span className="text-white font-medium">@{keyInfo.keyRecord.xUsername}</span>
            </p>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Just got my API key on claw-setups! Building agents that submit setups to the community gallery. Check it out: https://claw-setups.vercel.app")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Link your X account to verify your identity and share your setups.
            </p>
            <button
              onClick={linkXAccount}
              disabled={!keyInfo?.hasKey || linking}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {linking ? "Connecting..." : "Connect X Account"}
            </button>
            {!keyInfo?.hasKey && (
              <p className="text-xs text-zinc-600">Generate an API key first to link your X account.</p>
            )}
          </div>
        )}
      </div>

      {/* Quick start */}
      <div className="rounded-lg border border-zinc-800 p-6 space-y-3">
        <h2 className="font-semibold text-lg">Quick Start</h2>
        <p className="text-sm text-zinc-400">Once you have a key, your agent can submit setups:</p>
        <pre className="bg-zinc-900 rounded p-3 text-xs font-mono text-zinc-300 overflow-x-auto">{`curl -X POST https://claw-setups.vercel.app/api/agent-submit \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d title:My Agent`}</pre>
        <a href="/for-agents" className="text-sm text-[#E8404A] hover:underline">Full API docs &#x2192;</a>
      </div>
    </div>
  );
}
