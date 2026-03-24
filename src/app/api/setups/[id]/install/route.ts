import { NextRequest, NextResponse } from "next/server";
import { getSetupBySlug } from "@/lib/setups";
import { Setup } from "@/lib/types";

const BASE_URL = process.env.BASE_URL || "https://claw-setups.vercel.app";

function generateWorkspaceFilesSection(workspaceFiles: Record<string, string>): string {
  const lines: string[] = [];
  for (const [filename, content] of Object.entries(workspaceFiles)) {
    // Pick a heredoc sentinel that doesn't appear in the content
    const baseSentinel = `HEREDOC_${filename.replace(/[^A-Z0-9]/gi, "_").toUpperCase()}_END`;
    let sentinel = baseSentinel;
    let i = 0;
    while (content.includes(sentinel)) {
      sentinel = `${baseSentinel}_${++i}`;
    }

    lines.push(`cat > "$WORKSPACE_DIR/${filename}" << '${sentinel}'`);
    lines.push(content);
    lines.push(sentinel);
    lines.push(`echo "✅ Created ${filename}"`);
    lines.push("");
  }
  return lines.join("\n");
}

function hasPlaceholders(workspaceFiles?: Record<string, string>): boolean {
  if (!workspaceFiles) return false;
  return Object.values(workspaceFiles).some((v) => /\{\{[A-Z_]+\}\}/.test(v));
}

function generatePlaceholderSection(setupId: string, workspaceName: string): string {
  return `# ── Fill template variables ──
echo ""
echo "📝 Template variables found. Your agent will fill these from your workspace:"
echo "   Run this in your OpenClaw agent channel:"
echo ""
echo '   "Fill in the template variables in ${workspaceName}/SOUL.md and AGENTS.md'
echo '    using my existing SOUL.md and AGENTS.md as context."'
echo ""`;
}

function generatePlaceholderNoteSection(): string {
  return `echo "📝 Note: Template variables ({{...}}) need to be filled — tell your agent!"`;
}

function generateInstallScript(setup: Setup): string {
  const now = new Date().toISOString().split("T")[0];
  const workspaceName = `workspace-${setup.id}`;

  const workspaceFilesSection = setup.workspaceFiles && Object.keys(setup.workspaceFiles).length > 0
    ? generateWorkspaceFilesSection(setup.workspaceFiles)
    : `echo "ℹ️  No workspace files defined for this setup."`;

  const hasTpl = hasPlaceholders(setup.workspaceFiles);
  const placeholderSection = hasTpl
    ? generatePlaceholderSection(setup.id, workspaceName)
    : `# No template variables`;

  const placeholderNoteSection = hasTpl
    ? generatePlaceholderNoteSection()
    : ``;

  // Python script for openclaw.json registration
  // We write setup_id as a shell var and pass it into the python heredoc via env
  const pyScript = `import json, os, sys

setup_id = os.environ.get("SETUP_ID", "")
workspace_name = f"workspace-{setup_id}"
config_path = os.path.expanduser("~/.openclaw/openclaw.json")
workspace_dir = os.path.expanduser(f"~/.openclaw/{workspace_name}")

try:
    with open(config_path) as f:
        config = json.load(f)

    agents = config.get("agents", {}).get("list", [])
    existing = [a for a in agents if a.get("id") == setup_id]

    if not existing:
        agents.append({"id": setup_id, "workspace": workspace_dir})
        if "agents" not in config:
            config["agents"] = {}
        config["agents"]["list"] = agents
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        print(f"✅ Registered agent '{setup_id}' in openclaw.json")
    else:
        print(f"⚠️  Agent '{setup_id}' already registered")
except Exception as e:
    print(f"⚠️  Could not update openclaw.json: {e}", file=sys.stderr)`;

  return `#!/bin/bash
# ============================================================
# 🦞 claw-setups installer
# Setup:    ${setup.title}
# Source:   ${BASE_URL}/setups/${setup.id}
# Generated: ${now}
# ============================================================

set -e

SETUP_ID="${setup.id}"
WORKSPACE_NAME="workspace-${setup.id}"
WORKSPACE_DIR="\${HOME}/.openclaw/\${WORKSPACE_NAME}"
OPENCLAW_CONFIG="\${HOME}/.openclaw/openclaw.json"

echo ""
echo "🦞 Installing: ${setup.title}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Step 1: Create workspace directory ──
if [ -d "\$WORKSPACE_DIR" ]; then
  echo "⚠️  Workspace already exists: \$WORKSPACE_DIR"
  read -p "    Overwrite? [y/N] " yn
  case \$yn in [Yy]*) ;; *) echo "Aborted."; exit 0 ;; esac
fi
mkdir -p "\$WORKSPACE_DIR"
echo "✅ Created workspace: \$WORKSPACE_DIR"

# ── Step 2: Write workspace files ──
${workspaceFilesSection}

# ── Step 3: Register agent in openclaw.json ──
if [ -f "\$OPENCLAW_CONFIG" ]; then
  SETUP_ID="\$SETUP_ID" python3 << 'PYEOF'
${pyScript}
PYEOF
else
  echo "⚠️  openclaw.json not found at \$OPENCLAW_CONFIG"
  echo "    Skipping agent registration."
fi

# ── Step 4: Fill template variables (if any) ──
${placeholderSection}

# ── Step 5: Restart gateway ──
echo ""
echo "🔄 Restarting OpenClaw gateway..."
if command -v openclaw &> /dev/null; then
  openclaw gateway restart && echo "✅ Gateway restarted" || echo "⚠️  Gateway restart failed — run manually: openclaw gateway restart"
else
  echo "⚠️  openclaw CLI not found — run manually: openclaw gateway restart"
fi

# ── Done ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Done! ${setup.title} is installed."
echo ""
echo "📁 Workspace: \$WORKSPACE_DIR"
${placeholderNoteSection}
echo ""
echo "💬 Tell your agent:"
echo '   "Set up the ${setup.title} agent in ${workspaceName}"'
echo ""
`;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const setup = getSetupBySlug(params.id);
  if (!setup) {
    return new NextResponse("# Setup not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const script = generateInstallScript(setup);

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${setup.id}-install.sh"`,
    },
  });
}
