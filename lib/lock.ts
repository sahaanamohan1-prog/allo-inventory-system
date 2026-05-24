import { redis } from "./db";

export async function acquireLock(key: string) {
  const token = crypto.randomUUID();
  const lockKey = `lock:${key}`;
  const result = await redis.set(lockKey, token, { nx: true, px: 5000 });
  if (result !== "OK") return null;

  return async () => {
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else return 0 end
    `;
    await redis.eval(script, [lockKey], [token]);
  };
}