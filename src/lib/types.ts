export interface SetupAuthor {
  name: string;
  github: string;
}

export interface Setup {
  id: string;
  title: string;
  author: SetupAuthor;
  description: string;
  useCase: string;
  channels: string[];
  languages?: string[];  // content languages supported, e.g. ["en", "ja", "zh"]
  model: string;
  skills: string[];
  likes: number;
  createdAt: string;
  config: Record<string, unknown>;
  workspaceFiles?: Record<string, string>;  // may contain {{PLACEHOLDER}} tokens
  agentInstructions?: string;  // how the applying agent should handle this setup
}

// Standard agent instructions template (used when agentInstructions is not set)
export const DEFAULT_AGENT_INSTRUCTIONS = `To apply this setup:
1. Read the user's existing workspace files (SOUL.md, AGENTS.md, USER.md).
2. Identify all {{PLACEHOLDER}} tokens in the workspace files below.
3. Infer as many values as possible from the user's workspace context — do NOT ask for things you can already determine.
4. Only ask the user about values you cannot infer.
5. Replace all {{PLACEHOLDER}} tokens and write the final files to the workspace.
6. Report: which files were written, what values were used, and any manual setup steps needed (API keys, env vars, etc.).`;
