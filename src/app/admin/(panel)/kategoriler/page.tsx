import Link from "next/link";
import { deleteCategory } from "@/actions/categories";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { prisma } from "@/lib/prisma";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { parent: { select: { name: true } }, _count: { select: { products: true } } },
  });
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Kategoriler</h1>
        <Link href="/admin/kategoriler/yeni" className="inline-flex h-11 items-center rounded-md bg-accent px-4 font-semibold text-white">Yeni</Link>
      </div>
      <ul className="mt-6 space-y-3">
        {categories.map((category) => (
          <li key={category.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div>
              <Link href={`/admin/kategoriler/${category.id}`} className="font-semibold underline">{category.name}</Link>
              <p className="text-sm text-muted">
                {category.parent ? `${category.parent.name} / ` : ""}
                {category.published ? "Yayında" : "Gizli"} · {category._count.products} ürün
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await deleteCategory(category.id);
              }}
            >
              <ConfirmSubmit className="h-11 text-red-800" label="Sil" message="Bu kategoriyi silmek istediğinize emin misiniz?" />
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
