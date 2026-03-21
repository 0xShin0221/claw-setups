const SECRET_PATTERNS = [
  { pattern: /("(?:token|api_key|secret|password|apiKey|api_secret|access_token|auth_token|private_key|client_secret|webhook_url|phone_number_id|guild_id|ha_token|home_assistant_url)":\s*)"(?!(\*{3}REDACTED\*{3}))[^"]+"/g, label: "credential" },
  { pattern: /("(?:bot_token|slack_token|twilio_sid|twilio_auth)":\s*)"(?!(\*{3}REDACTED\*{3}))[^"]+"/g, label: "credential" },
];

export interface SanitizeResult {
  sanitized: string;
  secretsFound: number;
}

export function sanitizeConfig(jsonString: string): SanitizeResult {
  let secretsFound = 0;
  let sanitized = jsonString;

  for (const { pattern } of SECRET_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    sanitized = sanitized.replace(regex, (match, prefix) => {
      secretsFound++;
      return `${prefix}"***REDACTED***"`;
    });
  }

  return { sanitized, secretsFound };
}
