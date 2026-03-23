"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string;
}

interface KeyInfo {
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  submissionCount: number;
  revoked: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch key info
  const fetchKeyInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/key-info");
      if (res.ok) {
        const data = await res.json();
        setKeyInfo(data.key || null);
      }
    } catch {
      // KV may not be configured
    }
  }, []);

  useEffect(() => {
    if (user) fetchKeyInfo();
  }, [user, fetchKeyInfo]);

  const generateKey = async () => {
    if (
      keyInfo &&
      !keyInfo.revoked &&
      !confirm(
        "This will revoke your existing key immediately. Continue?"
      )
    ) {
      return;
    }
    setActionLoading(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await fetch("/api/dashboard/generate-key", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate key");
        return;
      }
      setNewKey(data.key);
      setKeyInfo({
        prefix: data.prefix,
        createdAt: data.createdAt,
        lastUsedAt: null,
        submissionCount: 0,
        revoked: false,
      });
    } catch {
      setError("Failed to generate key. Is Vercel KV configured?");
    } finally {
      setActionLoading(false);
    }
  };

  const revokeKey = async () => {
    if (!confirm("Revoke your API key? This cannot be undone.")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/revoke-key", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to revoke key");
        return;
      }
      setKeyInfo(null);
      setNewKey(null);
    } catch {
      setError("Failed to revoke key.");
    } finally {
      setActionLoading(false);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <h1 className="text-3xl font-bold">API Key Dashboard</h1>
        <p className="text-zinc-400">
          Sign in with GitHub to generate and manage your API key.
        </p>
        <a
          href="/api/auth/signin"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8404A] hover:bg-[#d63840] text-white font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Sign in with GitHub
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Key Dashboard</h1>
          <p className="text-zinc-400 mt-1">
            Signed in as{" "}
            <span className="text-white font-medium">{user.name || user.email}</span>
          </p>
        </div>
        <a
          href="/api/auth/signout"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Sign out
        </a>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Newly generated key */}
      {newKey && (
        <div className="rounded-lg border border-yellow-700 bg-yellow-950/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-yellow-300 text-sm font-medium">
            <span>&#9888;</span> This key will not be shown again
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm font-mono text-green-400 break-all">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Key status */}
      <div className="rounded-lg border border-zinc-800 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Your API Key</h2>
        {keyInfo && !keyInfo.revoked ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Key prefix</span>
                <p className="text-white font-mono mt-0.5">{keyInfo.prefix}</p>
              </div>
              <div>
                <span className="text-zinc-500">Created</span>
                <p className="text-white mt-0.5">
                  {new Date(keyInfo.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Last used</span>
                <p className="text-white mt-0.5">
                  {keyInfo.lastUsedAt
                    ? new Date(keyInfo.lastUsedAt).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Submissions</span>
                <p className="text-white mt-0.5">{keyInfo.submissionCount}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={generateKey}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Working..." : "Rotate Key"}
              </button>
              <button
                onClick={revokeKey}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Revoke Key
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-zinc-400 text-sm">
              No active API key. Generate one to start submitting setups
              programmatically.
            </p>
            <button
              onClick={generateKey}
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-lg bg-[#E8404A] hover:bg-[#d63840] text-white font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Generating..." : "Generate API Key"}
            </button>
          </div>
        )}
      </div>

      {/* Usage instructions */}
      <div className="rounded-lg border border-zinc-800 p-6 space-y-3">
        <h2 className="text-lg font-semibold">Quick Start</h2>
        <p className="text-zinc-400 text-sm">
          Use your key in the <code className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-xs">Authorization</code> header:
        </p>
        <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-sm font-mono text-zinc-300">
{`curl -X POST https://claw-setups.vercel.app/api/agent-submit \\
  -H "Authorization: Bearer csk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"My Setup", ...}'`}
        </pre>
        <p className="text-zinc-500 text-xs">
          See the{" "}
          <a href="/for-agents" className="text-[#E8404A] hover:underline">
            full API docs
          </a>{" "}
          for all available fields and options.
        </p>
      </div>
    </div>
  );
}
