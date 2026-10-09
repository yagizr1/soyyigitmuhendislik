import { CategoryForm } from "@/components/admin/category-form";
import { prisma } from "@/lib/prisma";

export default async function NewCategoryPage() {
  const [parents, media] = await Promise.all([
    prisma.category.findMany({ where: { parentId: null }, select: { id: true, name: true } }),
    prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, alt: true } }),
  ]);
  return (
    <div>
      <h1 className="font-display text-4xl">Yeni kategori</h1>
      <div className="mt-6">
        <CategoryForm
          id={null}
          parents={parents}
          media={media}
          specFields={[]}
          category={{ name: "", slug: "", description: "", parentId: "", sortOrder: 0, published: false, seoTitle: "", seoDescription: "", imageId: "" }}
        />
      </div>
    </div>
  );
}
