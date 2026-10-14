import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QUOTE_STATUS_LABELS } from "@/lib/units";

export default async function DashboardPage() {
  const [products, published, categories, quotes, recentProducts, recentQuotes] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.category.count({ where: { published: true } }),
    prisma.quoteRequest.count(),
    prisma.product.findMany({ orderBy: { updatedAt: "desc" }, take: 6, select: { id: true, name: true, sku: true, published: true } }),
    prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { items: { select: { id: true } } } }),
  ]);
  const cards = [
    { label: "Ürün", value: products, href: "/admin/urunler" },
    { label: "Yayında", value: published, href: "/admin/urunler" },
    { label: "Kategori", value: categories, href: "/admin/kategoriler" },
    { label: "Teklif", value: quotes, href: "/admin/teklifler" },
  ];
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Özet</h1>
          <p className="mt-2 text-sm text-muted">Katalog ve gelen talepler.</p>
        </div>
        <Link href="/admin/urunler/yeni" className="inline-flex h-11 items-center rounded-md bg-accent px-4 font-semibold text-white">
          Yeni ürün
        </Link>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 font-display text-4xl">{card.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Son ürünler</h2>
            <Link href="/admin/urunler" className="text-sm font-semibold text-accent">Tümü</Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {recentProducts.length === 0 ? <li className="py-3 text-sm text-muted">Henüz ürün yok.</li> : null}
            {recentProducts.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/admin/urunler/${product.id}`} className="font-medium hover:underline">
                  {product.name}
                </Link>
                <span className="shrink-0 text-sm text-muted">{product.published ? "Yayında" : "Taslak"}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Son teklifler</h2>
            <Link href="/admin/teklifler" className="text-sm font-semibold text-accent">Tümü</Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {recentQuotes.length === 0 ? <li className="py-3 text-sm text-muted">Henüz teklif yok.</li> : null}
            {recentQuotes.map((quote) => (
              <li key={quote.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/admin/teklifler/${quote.id}`} className="font-medium hover:underline">
                  {quote.companyName}
                </Link>
                <span className="shrink-0 text-sm text-muted">
                  {QUOTE_STATUS_LABELS[quote.status]} · {quote.items.length} kalem
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
