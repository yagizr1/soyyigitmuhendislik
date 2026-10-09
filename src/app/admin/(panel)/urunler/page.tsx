import Link from "next/link";
import { ProductTable } from "@/components/admin/product-table";
import { importProductsCsv } from "@/actions/products";
import { prisma } from "@/lib/prisma";
import { one } from "@/lib/search";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = one((await searchParams).q);
  const products = await prisma.product.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] }
      : undefined,
    include: { category: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Ürünler</h1>
        <Link href="/admin/urunler/yeni" className="inline-flex h-11 items-center rounded-md bg-accent px-4 font-semibold text-white">
          Yeni ürün
        </Link>
      </div>
      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <input name="q" defaultValue={q ?? ""} placeholder="Ad veya kod" className="h-11 rounded-md border border-border px-3" />
        <button className="h-11 rounded-md bg-steel px-4 text-white">Ara</button>
        <a href="/api/admin/urunler.csv" className="inline-flex h-11 items-center rounded-md border border-border px-4">CSV indir</a>
      </form>
      <form
        className="mt-4 flex flex-wrap items-center gap-2"
        action={async (formData) => {
          "use server";
          const result = await importProductsCsv(formData);
          if (!result.ok) throw new Error(result.message);
        }}
      >
        <input type="file" name="file" accept=".csv,text/csv" className="text-sm" required />
        <button className="h-11 rounded-md border border-border px-4">CSV içe aktar</button>
      </form>
      <div className="mt-6">
        {products.length === 0 ? (
          <p>Henüz ürün yok.</p>
        ) : (
          <ProductTable
            rows={products.map((product) => ({
              id: product.id,
              name: product.name,
              sku: product.sku,
              published: product.published,
              featured: product.featured,
              category: product.category.name,
            }))}
          />
        )}
      </div>
    </div>
  );
}
