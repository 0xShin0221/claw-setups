const SECRET_KEY_PATTERNS = [
  /api_key/i,
  /apikey/i,
  /\btoken\b/i,
  /\bsecret\b/i,
  /password/i,
  /passwd/i,
  /\bbearer\b/i,
  /authorization/i,
  /private_key/i,
  /client_secret/i,
  /access_token/i,
  /auth_token/i,
  /webhook_url/i,
  /bot_token/i,
  /slack_token/i,
  /twilio_sid/i,
  /twilio_auth/i,
];

const SECRET_VALUE_PATTERNS = [
  /\bsk-[a-zA-Z0-9]{20,}/,
  /\bpk-[a-zA-Z0-9]{20,}/,
  /\bghp_[a-zA-Z0-9]{36,}/,
  /\bgho_[a-zA-Z0-9]{36,}/,
  /\br8_[a-zA-Z0-9]{20,}/,
  /ELEVENLABS[_-]?[A-Za-z0-9]{10,}/i,
  /ANTHROPIC[_-]?[A-Za-z0-9]{10,}/i,
  /OPENAI[_-]?[A-Za-z0-9]{10,}/i,
  /REPLICATE[_-]?[A-Za-z0-9]{10,}/i,
];

const REDACTED = "***REDACTED***";

export function scanAndRedact(text: string): { text: string; secretsFound: number } {
  let secretsFound = 0;

  // Scan JSON key-value pairs
  const keyValuePattern = /"([^"]+)"\s*:\s*"([^"]+)"/g;
  let result = text.replace(keyValuePattern, (match, key: string, value: string) => {
    if (value === REDACTED) return match;

    // Check if key matches secret patterns
    for (const pattern of SECRET_KEY_PATTERNS) {
      if (pattern.test(key)) {
        secretsFound++;
        return `"${key}": "${REDACTED}"`;
      }
    }

    // Check if value matches secret value patterns
    for (const pattern of SECRET_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        secretsFound++;
        return `"${key}": "${REDACTED}"`;
      }
    }

    return match;
  });

  // Also scan standalone secret values outside JSON structure
  for (const pattern of SECRET_VALUE_PATTERNS) {
    const globalPattern = new RegExp(pattern.source, "g" + (pattern.flags.includes("i") ? "i" : ""));
    result = result.replace(globalPattern, (match) => {
      if (match === REDACTED) return match;
      secretsFound++;
      return REDACTED;
    });
  }

  return { text: result, secretsFound };
}
