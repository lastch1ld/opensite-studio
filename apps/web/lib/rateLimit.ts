// In-memory fixed-window limiter — fine for a single-instance self-hosted
// deploy (docs/forms.md's own framing: "basic rate limiting... not required
// to be more than that for the first working version"). Doesn't share state
// across instances/restarts; an obvious upgrade point, not a rewrite, if
// that's ever needed.
const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

export function checkRateLimit(key: string, max = MAX_PER_WINDOW, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
