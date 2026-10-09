import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function PagesAdmin() {
  const pages = await prisma.page.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="font-display text-4xl">Sayfalar</h1>
      <ul className="mt-6 space-y-3">
        {pages.map((page) => (
          <li key={page.id} className="rounded-lg border border-border bg-card p-3">
            <Link href={`/admin/sayfalar/${page.id}`} className="font-semibold underline">{page.title}</Link>
            <p className="text-sm text-muted">/{page.slug} · {page.published ? "Yayında" : "Kapalı"} · menü: {page.showInNav ? "evet" : "hayır"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
