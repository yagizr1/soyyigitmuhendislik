"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { fieldErrors, userCreateSchema } from "@/lib/validators";
import { fail, type ActionResult } from "@/lib/action-result";
import { hashPassword, passwordIssues } from "@/lib/password";
import { isUniqueConstraint, publicErrorMessage } from "@/lib/errors";
import { getSession } from "@/lib/session";

export async function createUser(input: unknown): Promise<ActionResult> {
  try {
    const actor = await requirePermission("users.write");
    const parsed = userCreateSchema.safeParse(input);
    if (!parsed.success) return fail("Kullanıcı formunu kontrol edin.", fieldErrors(parsed.error));
    const issues = passwordIssues(parsed.data.password);
    if (issues.length) return fail(issues[0] ?? "Parola uygun değil.");
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        username: parsed.data.username.toLowerCase(),
        email: parsed.data.email.toLowerCase(),
        passwordHash: await hashPassword(parsed.data.password),
        role: parsed.data.role,
      },
    });
    await audit({
      userId: actor.id,
      action: "user.create",
      entity: "User",
      entityId: user.id,
      summary: `${user.username} hesabı oluşturuldu`,
    });
    return { ok: true };
  } catch (error) {
    if (isUniqueConstraint(error)) return fail("Bu kullanıcı adı veya e-posta zaten kayıtlı.");
    return fail(publicErrorMessage(error, "Kullanıcı oluşturulamadı."));
  }
}

export async function updateUserAccess(id: string, role: "ADMIN" | "EDITOR", active: boolean): Promise<ActionResult> {
  try {
    const actor = await requirePermission("users.write");
    const session = await getSession();
    if (session?.id === id && !active) return fail("Kendi hesabınızı pasifleştiremezsiniz.");
    if (role !== "ADMIN" || !active) {
      const otherAdmins = await prisma.user.count({
        where: { role: "ADMIN", active: true, id: { not: id } },
      });
      const current = await prisma.user.findUnique({ where: { id }, select: { role: true, active: true } });
      if (current?.role === "ADMIN" && current.active && otherAdmins === 0) {
        return fail("Son etkin yönetici hesabı kapatılamaz.");
      }
    }
    await prisma.user.update({ where: { id }, data: { role, active } });
    await audit({
      userId: actor.id,
      action: "user.access",
      entity: "User",
      entityId: id,
      summary: "Kullanıcı yetkisi güncellendi",
    });
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Kullanıcı güncellenemedi."));
  }
}
