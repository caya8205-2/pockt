const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const buckets = new Map<string, number[]>();

export function authKey(request: any): string {
  const ip = request.headers['cf-connecting-ip'] || request.ip || 'unknown';
  return `auth:${ip}`;
}

function recentAttempts(key: string): number[] {
  const now = Date.now();
  const attempts = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  buckets.set(key, attempts);
  return attempts;
}

export function isRateLimited(key: string): boolean {
  return recentAttempts(key).length >= MAX_ATTEMPTS;
}

export function recordAttempt(key: string): void {
  const attempts = recentAttempts(key);
  attempts.push(Date.now());
  buckets.set(key, attempts);
}

export function clearAttempts(key: string): void {
  buckets.delete(key);
}

export function retryAfterSec(key: string): number {
  const attempts = recentAttempts(key);
  if (attempts.length === 0) return 0;
  return Math.max(1, Math.ceil((attempts[0] + WINDOW_MS - Date.now()) / 1000));
}

export function resetRateLimits(): void {
  buckets.clear();
}
