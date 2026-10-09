import { UserAdmin } from "@/components/admin/user-admin";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, username: true, email: true, role: true, active: true },
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Kullanıcılar</h1>
      <p className="mt-2 text-sm text-muted">Parolalar hash olarak saklanır. Geçici parolayı güvenli bir kanaldan iletin.</p>
      <div className="mt-6">
        <UserAdmin users={users} />
      </div>
    </div>
  );
}
