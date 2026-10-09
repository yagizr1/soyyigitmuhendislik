import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  readSessionToken,
  sessionCookieOptions,
  signSession,
  SESSION_COOKIE,
  type SessionClaims,
} from "@/lib/session-token";

export type SessionUser = SessionClaims;
export { signSession, SESSION_COOKIE };

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    ...sessionCookieOptions,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await readSessionToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  if (!user?.active) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Oturum gerekli.");
  return session;
}
