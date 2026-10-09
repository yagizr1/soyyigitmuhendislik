import { jwtVerify, SignJWT } from "jose";
import type { AppRole } from "@/lib/permissions";

export const SESSION_COOKIE = "sm_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export type SessionClaims = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

export function authSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionClaims): Promise<string> {
  const key = authSecret();
  if (!key) throw new Error("AUTH_SECRET tanımlı değil veya 32 karakterden kısa.");
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(key);
}

export async function readSessionToken(token: string): Promise<SessionClaims | null> {
  const key = authSecret();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null;
    }
    if (payload.role !== "ADMIN" && payload.role !== "EDITOR") return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "",
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
