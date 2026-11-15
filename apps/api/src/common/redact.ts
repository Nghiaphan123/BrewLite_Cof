export function redact(value: string): string {
  return value
    .replace(/bearer\s+[a-z0-9\-._~+/]+/gi, '[redacted]')
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]')
    .replace(/(?:password|jwt_secret|database_url|token)\s*[:=]\s*\S+/gi, '[redacted]');
}

export function isSafeRequestId(value: string): boolean {
  return /^[A-Za-z0-9-]{8,80}$/.test(value);
}
