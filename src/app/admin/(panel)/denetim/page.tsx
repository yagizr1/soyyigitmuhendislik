import { prisma } from "@/lib/prisma";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } } },
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Denetim kaydı</h1>
      <ul className="mt-6 space-y-2 text-sm">
        {logs.map((log) => (
          <li key={log.id} className="rounded-md border border-border bg-card p-3">
            <p>{log.summary}</p>
            <p className="text-muted">
              {log.createdAt.toLocaleString("tr-TR")} · {log.user?.email ?? "sistem"} · {log.action}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
