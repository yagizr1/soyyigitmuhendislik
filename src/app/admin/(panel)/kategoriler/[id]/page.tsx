import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { prisma } from "@/lib/prisma";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [category, parents, media] = await Promise.all([
    prisma.category.findUnique({ where: { id }, include: { specFields: { orderBy: { sortOrder: "asc" } } } }),
    prisma.category.findMany({ where: { parentId: null, id: { not: id } }, select: { id: true, name: true } }),
    prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, alt: true } }),
  ]);
  if (!category) notFound();
  return (
    <div>
      <h1 className="font-display text-4xl">{category.name}</h1>
      <div className="mt-6">
        <CategoryForm
          id={category.id}
          parents={parents}
          media={media}
          specFields={category.specFields.map((field) => ({
            key: field.key,
            label: field.label,
            unit: field.unit ?? "",
            filterable: field.filterable,
            sortOrder: field.sortOrder,
          }))}
          category={{
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            parentId: category.parentId ?? "",
            sortOrder: category.sortOrder,
            published: category.published,
            seoTitle: category.seoTitle ?? "",
            seoDescription: category.seoDescription ?? "",
            imageId: category.imageId ?? "",
          }}
        />
      </div>
    </div>
  );
}
