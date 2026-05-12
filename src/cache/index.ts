import NodeCache from "node-cache";

const cache = new NodeCache();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== undefined) return hit;
  const data = await fetcher();
  cache.set(key, data, ttlSeconds);
  return data;
}
