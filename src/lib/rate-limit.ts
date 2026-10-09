import "server-only";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 5;

export async function assertLoginAllowed(key: string): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await prisma.loginAttempt.count({
    where: { key, createdAt: { gte: since } },
  });
  if (count >= LOGIN_LIMIT) {
    throw new Error("Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin.");
  }
}

export async function recordLoginFailure(key: string): Promise<void> {
  await prisma.loginAttempt.create({ data: { key } });
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
}

export async function clearLoginFailures(key: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key } });
}

const actionBuckets = new Map<string, number[]>();

export function assertActionRate(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const recent = (actionBuckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    throw new Error("Çok sık işlem yapıldı. Bir süre sonra tekrar deneyin.");
  }
  recent.push(now);
  actionBuckets.set(key, recent);
}
