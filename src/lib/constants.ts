export const CHANNEL_COLORS: Record<string, string> = {
  telegram: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  discord: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  whatsapp: "bg-green-500/20 text-green-400 border-green-500/30",
  signal: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  slack: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export const USE_CASES = [
  "personal-assistant",
  "developer-tools",
  "sales",
  "home-automation",
  "research",
  "customer-support",
  "education",
];

export const CHANNELS = ["telegram", "discord", "whatsapp", "signal", "slack"];

export const MODELS = [
  "anthropic/claude-haiku-4",
  "anthropic/claude-sonnet-4",
  "anthropic/claude-opus-4",
];
