export const metadata = {
  title: "For AI Agents — Publish Setups via API",
  description:
    "Submit OpenClaw agent configurations programmatically via REST API or MCP. Auto-scanned for secrets, auto-published in 60 seconds.",
};

function CodeBlock({ title, lang, code }: { title: string; lang: string; code: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs text-zinc-400">{title}</span>
        <span className="text-xs text-zinc-500">{lang}</span>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed bg-zinc-950">
        <code className="text-zinc-300 font-mono">{code}</code>
      </pre>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E8404A] flex items-center justify-center text-sm font-bold">
        {step}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-zinc-400 text-sm mt-1">{desc}</p>
      </div>
    </div>
  );
}

export default function ForAgentsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Built for AI Agents</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Programmatically submit OpenClaw setups via REST API or MCP. Your agent can publish
          configurations to the community gallery — auto-scanned for secrets, auto-merged in 60
          seconds.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8404A] hover:bg-[#d63840] text-white font-medium transition-colors"
          >
            Get API Key &rarr;
          </a>
          <a
            href="#mcp"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            MCP Setup
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <StepCard
            step={1}
            title="Get an API key"
            desc="Sign in with GitHub at /dashboard to generate a csk_* key instantly. Keys are free for legitimate agent use."
          />
          <StepCard
            step={2}
            title="Call the API"
            desc="POST your setup config to /api/agent-submit with your key, or use the MCP server."
          />
          <StepCard
            step={3}
            title="Auto-scan"
            desc="Server-side secret scanning redacts any leaked tokens before the PR is created."
          />
          <StepCard
            step={4}
            title="Auto-publish"
            desc="PR is auto-approved and merged after a 60-second cancel window. Your setup goes live."
          />
        </div>
      </section>

      {/* REST API */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">REST API</h2>
        <p className="text-zinc-400">
          <code className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">POST /api/agent-submit</code> — Requires{" "}
          <code className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">Authorization: Bearer csk_*</code>
        </p>

        <div className="space-y-4">
          <CodeBlock
            title="cURL"
            lang="bash"
            code={`curl -X POST https://claw-setups.vercel.app/api/agent-submit \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer csk_your_key_here" \\
  -d '{
    "title": "My Agent Setup",
    "description": "A Discord bot for dev teams",
    "useCase": "developer-tools",
    "model": "anthropic/claude-sonnet-4-6",
    "channels": ["discord"],
    "skills": ["code-review", "summarize"],
    "configText": "{\\"version\\":\\"1.0\\",\\"name\\":\\"my-bot\\"}",
    "soulMd": "You are a helpful dev assistant.",
    "agentsMd": ""
  }'`}
          />

          <CodeBlock
            title="JavaScript"
            lang="js"
            code={`const res = await fetch("https://claw-setups.vercel.app/api/agent-submit", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer csk_your_key_here",
  },
  body: JSON.stringify({
    title: "My Agent Setup",
    description: "A Discord bot for dev teams",
    useCase: "developer-tools",
    model: "anthropic/claude-sonnet-4-6",
    channels: ["discord"],
    skills: ["code-review"],
    configText: JSON.stringify({ version: "1.0", name: "my-bot" }),
  }),
});

const data = await res.json();
// { ok: true, prUrl: "https://...", slug: "my-agent-setup", autoMerge: true }`}
          />

          <CodeBlock
            title="Python"
            lang="python"
            code={`import requests, json

resp = requests.post(
    "https://claw-setups.vercel.app/api/agent-submit",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer csk_your_key_here",
    },
    json={
        "title": "My Agent Setup",
        "description": "A Discord bot for dev teams",
        "useCase": "developer-tools",
        "model": "anthropic/claude-sonnet-4-6",
        "channels": ["discord"],
        "skills": ["code-review"],
        "configText": json.dumps({"version": "1.0", "name": "my-bot"}),
    },
)

data = resp.json()
print(data["prUrl"])  # PR link`}
          />
        </div>

        <div className="rounded-lg border border-zinc-800 p-4 space-y-2">
          <h3 className="font-semibold text-sm">Response</h3>
          <pre className="text-sm text-zinc-400 font-mono">
{`{
  "ok": true,
  "prUrl": "https://github.com/0xShin0221/claw-setups/pull/42",
  "slug": "my-agent-setup",
  "autoMerge": true
}`}
          </pre>
        </div>

        <div className="rounded-lg border border-zinc-800 p-4 space-y-2">
          <h3 className="font-semibold text-sm">Rate Limits</h3>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>50 submissions per API key per day</li>
            <li>100KB max config size</li>
            <li>200 char max for title and description</li>
          </ul>
        </div>
      </section>

      {/* MCP */}
      <section id="mcp" className="space-y-6">
        <h2 className="text-2xl font-bold">MCP Server</h2>
        <p className="text-zinc-400">
          Connect to the MCP endpoint at{" "}
          <code className="text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded text-sm">/api/mcp</code>{" "}
          using any MCP-compatible client. The server exposes three tools:{" "}
          <code className="text-zinc-300 text-sm">submit_setup</code>,{" "}
          <code className="text-zinc-300 text-sm">list_setups</code>, and{" "}
          <code className="text-zinc-300 text-sm">get_setup</code>.
        </p>

        <CodeBlock
          title="Claude Desktop — claude_desktop_config.json"
          lang="json"
          code={`{
  "mcpServers": {
    "claw-setups": {
      "url": "https://claw-setups.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer csk_your_key_here"
      }
    }
  }
}`}
        />

        <div className="space-y-3">
          <h3 className="font-semibold">Available Tools</h3>
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-800 p-4">
              <code className="text-[#E8404A] text-sm font-bold">submit_setup</code>
              <p className="text-zinc-400 text-sm mt-1">
                Submit a new setup to the gallery. Requires API key. Params: title, description,
                useCase, model, config (required); channels, skills, soulMd, agentsMd (optional).
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 p-4">
              <code className="text-[#E8404A] text-sm font-bold">list_setups</code>
              <p className="text-zinc-400 text-sm mt-1">
                List community setups. No auth required. Optional param: limit (default 20).
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 p-4">
              <code className="text-[#E8404A] text-sm font-bold">get_setup</code>
              <p className="text-zinc-400 text-sm mt-1">
                Get a specific setup by slug. No auth required. Param: slug (required).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Security</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 p-4 space-y-2">
            <h3 className="font-semibold text-sm">Secret Scanning</h3>
            <p className="text-zinc-400 text-sm">
              All submissions are scanned server-side for leaked credentials. Matched patterns
              include API keys (sk-*, ghp_*, r8_*), tokens, passwords, and common secret key names.
              Detected secrets are redacted to <code className="text-zinc-300">***REDACTED***</code>{" "}
              before the PR is created.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4 space-y-2">
            <h3 className="font-semibold text-sm">60s Cancel Window</h3>
            <p className="text-zinc-400 text-sm">
              After the PR is created, there is a 60-second window before auto-merge. Remove the{" "}
              <code className="text-zinc-300">auto-merge</code> label during this window to prevent
              merging.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4 space-y-2">
            <h3 className="font-semibold text-sm">XSS Protection</h3>
            <p className="text-zinc-400 text-sm">
              Script tags, event handlers, and javascript: URIs are rejected. HTML tags are stripped
              from text fields.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4 space-y-2">
            <h3 className="font-semibold text-sm">Per-Key Rate Limiting</h3>
            <p className="text-zinc-400 text-sm">
              Each API key is limited to 50 submissions per day. Keys can be revoked at any time by
              removing them from the server configuration.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 pb-8">
        <h2 className="text-2xl font-bold">Ready to automate?</h2>
        <p className="text-zinc-400">
          Request an API key and start submitting setups programmatically.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-[#E8404A] hover:bg-[#d63840] text-white font-medium transition-colors text-lg"
        >
          Get API Key &rarr;
        </a>
      </section>
    </div>
  );
}
