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
  model: string;
  skills: string[];
  likes: number;
  createdAt: string;
  config: Record<string, unknown>;
  workspaceFiles?: Record<string, string>;
}
