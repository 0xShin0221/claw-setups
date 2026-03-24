export interface SetupAuthor {
  name: string;
  github: string;
}

export interface SetupVariable {
  name: string;          // e.g. "TARGET_MARKET"
  description: string;   // shown to user / agent
  default?: string;      // agent uses this if it can infer nothing
  inferFrom?: string[];  // workspace fields agent should read first, e.g. ["USER.md", "SOUL.md"]
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
  workspaceFiles?: Record<string, string>;
  variables?: SetupVariable[];    // template variables for customization
  agentInstructions?: string;     // how the applying agent should behave
}
