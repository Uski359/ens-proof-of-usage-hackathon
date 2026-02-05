const ensCache = new Map<string, { addr: string; exp: number }>();
const TTL = 10 * 60 * 1000;

export async function resolveEnsCached(
  name: string,
  resolveEns: (n: string) => Promise<string>
): Promise<string> {
  const key = name.toLowerCase();
  const now = Date.now();

  const hit = ensCache.get(key);
  if (hit && hit.exp > now) {
    return hit.addr;
  }

  const addr = await resolveEns(name);
  ensCache.set(key, { addr, exp: now + TTL });
  return addr;
}
