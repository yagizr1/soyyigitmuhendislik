import "server-only";
import { headers } from "next/headers";

export async function clientKey(email?: string): Promise<string> {
  const headerStore = await headers();
  let ip = "local";
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = headerStore.get("x-forwarded-for");
    if (forwarded) ip = forwarded.split(",")[0]?.trim() || ip;
  } else {
    ip = headerStore.get("x-real-ip") || ip;
  }
  return `${ip}|${(email ?? "").toLowerCase()}`;
}
