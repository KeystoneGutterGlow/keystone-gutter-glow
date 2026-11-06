// Best-effort limit per IP, per server instance. It stops a script hammering one instance. It
// isn't a global guarantee, and the database constraints are what actually protect the schedule.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED = 5000;

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function allowRequest(scope: string, request: Request, limit: number, windowMs = 60_000, now = Date.now()): boolean {
  const key = `${scope}:${clientIp(request)}`;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count++;
  return bucket.count <= limit;
}

export function resetRateLimits() {
  buckets.clear();
}

/** Reads a JSON body with a size cap. Returns undefined when it's too big or not JSON. */
export async function readJson(request: Request, maxBytes = 16_384): Promise<unknown> {
  const text = await request.text().catch(() => "");
  if (!text || text.length > maxBytes) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
