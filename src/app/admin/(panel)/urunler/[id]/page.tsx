import { notFound } from "next/navigation";
import { deleteProductImage, moveProductImage, uploadProductImage } from "@/actions/products";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" }, include: { media: true } },
        category: { include: { specFields: { orderBy: { sortOrder: "asc" } } } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  const specs = (product.specs ?? {}) as Record<string, string>;
  return (
    <div>
      <h1 className="font-display text-4xl">{product.name}</h1>
      <div className="mt-6 max-w-4xl">
        <ProductForm
          id={product.id}
          categories={categories}
          specFields={product.category.specFields}
          values={{
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            categoryId: product.categoryId,
            description: product.description,
            profileType: product.profileType ?? "",
            sectionShape: product.sectionShape ?? "",
            widthMm: product.widthMm?.toString() ?? "",
            heightMm: product.heightMm?.toString() ?? "",
            thicknessMm: product.thicknessMm?.toString() ?? "",
            lengthMm: product.lengthMm?.toString() ?? "",
            materialGrade: product.materialGrade ?? "",
            weightPerMeter: product.weightPerMeter?.toString() ?? "",
            unit: product.unit,
            unitPrice: product.unitPrice?.toString() ?? "",
            stockStatus: product.stockStatus,
            minOrderQty: product.minOrderQty.toString(),
            featured: product.featured,
            published: product.published,
            seoTitle: product.seoTitle ?? "",
            seoDescription: product.seoDescription ?? "",
            specs,
          }}
        />
      </div>
      <section className="mt-10 max-w-3xl">
        <h2 className="font-display text-2xl">Görseller</h2>
        <form
          action={async (formData) => {
            "use server";
            await uploadProductImage(formData);
          }}
          className="mt-3 grid gap-2"
        >
          <input type="hidden" name="productId" value={product.id} />
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required />
          <input name="alt" placeholder="Alternatif metin" className="h-11 rounded-md border border-border px-3" required />
          <button className="h-11 w-fit rounded-md bg-steel px-4 text-white">Görsel yükle</button>
        </form>
        <ul className="mt-4 space-y-3">
          {product.images.map((image) => (
            <li key={image.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.media.url} alt={image.alt} className="h-16 w-16 rounded object-cover" />
              <p className="text-sm">{image.alt}</p>
              <form
                action={async () => {
                  "use server";
                  await moveProductImage(image.id, "up");
                }}
              >
                <button className="h-11 px-2">Yukarı</button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await moveProductImage(image.id, "down");
                }}
              >
                <button className="h-11 px-2">Aşağı</button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteProductImage(image.id);
                }}
              >
                <ConfirmSubmit className="h-11 px-2 text-red-800" label="Sil" message="Bu ürün görselini kaldırmak istediğinize emin misiniz?" />
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
