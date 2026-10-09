"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, passwordIssues, verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validators";
import { fail, type ActionResult } from "@/lib/action-result";
import { fieldErrors } from "@/lib/validators";
import {
  assertLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/rate-limit";
import { clientKey } from "@/lib/request-meta";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/session";
import { signSession } from "@/lib/session-token";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { mailConfigured, sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/site";
import { publicErrorMessage } from "@/lib/errors";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail("Giriş bilgilerini kontrol edin.", fieldErrors(parsed.error));
  const username = parsed.data.username.trim().toLowerCase();
  const key = await clientKey(username);
  try {
    await assertLoginAllowed(key);
    const user = await prisma.user.findUnique({ where: { username } });
    const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
    if (!user || !valid || !user.active) {
      await recordLoginFailure(key);
      await audit({
        userId: user?.id,
        action: "login.failure",
        entity: "User",
        entityId: user?.id,
        summary: "Başarısız yönetici girişi",
      });
      return fail("Kullanıcı adı veya parola hatalı.");
    }
    await clearLoginFailures(key);
    const token = await signSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);
    await audit({
      userId: user.id,
      action: "login.success",
      entity: "User",
      entityId: user.id,
      summary: "Yönetici girişi",
    });
    return { ok: true };
  } catch (error) {
    logger.error("login_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Giriş tamamlanamadı."));
  }
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    await audit({
      userId: session.id,
      action: "logout",
      entity: "User",
      entityId: session.id,
      summary: "Yönetici çıkışı",
    });
  }
  await clearSessionCookie();
  redirect("/admin/giris");
}

export async function requestPasswordReset(emailInput: string): Promise<ActionResult> {
  const email = emailInput.trim().toLowerCase();
  const generic =
    "Eğer bu e-posta kayıtlıysa ve e-posta sunucusu tanımlıysa sıfırlama bağlantısı gönderilir. Sunucu tanımlı değilse parola, sunucuda npm run admin:reset-password komutuyla sıfırlanır.";
  if (!email.includes("@")) return fail("Geçerli bir e-posta girin.");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !mailConfigured()) return { ok: true };
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  const url = `${siteUrl()}/admin/parola-sifirla/${token}`;
  const sent = await sendMail(
    user.email,
    "Yönetici parolası sıfırlama",
    `Parolanızı sıfırlamak için bağlantı 1 saat geçerlidir:\n${url}\n\nBu isteği siz yapmadıysanız iletiyi yok sayın.`,
  );
  if (!sent) return { ok: true };
  await audit({
    userId: user.id,
    action: "password.reset.request",
    entity: "User",
    entityId: user.id,
    summary: "Parola sıfırlama bağlantısı oluşturuldu",
  });
  return { ok: true, ...(generic ? {} : {}) };
}

export async function resetPasswordWithToken(token: string, password: string): Promise<ActionResult> {
  const issues = passwordIssues(password);
  if (issues.length) return fail(issues[0] ?? "Parola uygun değil.");
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return fail("Bağlantı geçersiz veya süresi dolmuş.");
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  await audit({
    userId: row.userId,
    action: "password.reset",
    entity: "User",
    entityId: row.userId,
    summary: "Parola sıfırlandı",
  });
  return { ok: true };
}

export async function changeOwnPassword(currentPassword: string, nextPassword: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return fail("Oturum gerekli.");
  const issues = passwordIssues(nextPassword);
  if (issues.length) return fail(issues[0] ?? "Parola uygun değil.");
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return fail("Hesap bulunamadı.");
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return fail("Mevcut parola hatalı.");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(nextPassword) },
  });
  await audit({
    userId: user.id,
    action: "password.change",
    entity: "User",
    entityId: user.id,
    summary: "Parola değiştirildi",
  });
  return { ok: true };
}
