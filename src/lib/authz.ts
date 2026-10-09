import "server-only";
import { can, type Permission } from "@/lib/permissions";
import { requireUser, type SessionUser } from "@/lib/session";

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  return user;
}
