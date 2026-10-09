import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QUOTE_STATUS_LABELS } from "@/lib/units";

export default async function DashboardPage() {
  const [products, published, categories, quotes, recentProducts, recentQuotes, recentAudits] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.category.count(),
    prisma.quoteRequest.count(),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, sku: true, published: true } }),
    prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { items: { select: { id: true } } } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, summary: true, createdAt: true } }),
  ]);
  const cards = [
    ["Toplam ürün", products],
    ["Yayındaki ürün", published],
    ["Kategori", categories],
    ["Teklif / ileti", quotes],
  ];
  return (
    <div>
      <h1 className="font-display text-4xl">Özet</h1>
      <p className="mt-2 text-sm text-muted">Yalnızca veritabanındaki kayıtlar sayılır. Ziyaretçi sayısı ölçülmüyor.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted">{label}</p>
            <p className="font-display text-4xl">{value}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-2xl">Son ürünler</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentProducts.map((product) => (
              <li key={product.id}>
                <Link href={`/admin/urunler/${product.id}`} className="underline">
                  {product.name}
                </Link>{" "}
                <span className="text-muted">{product.published ? "yayında" : "taslak"}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-2xl">Son talepler</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentQuotes.map((quote) => (
              <li key={quote.id}>
                <Link href={`/admin/teklifler/${quote.id}`} className="underline">
                  {quote.companyName}
                </Link>{" "}
                · {QUOTE_STATUS_LABELS[quote.status]} · {quote.items.length} kalem
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-2xl">Son işlemler</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentAudits.map((entry) => (
              <li key={entry.id}>
                {entry.summary}
                <span className="block text-muted">{entry.createdAt.toLocaleString("tr-TR")}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
