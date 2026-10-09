import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div>
      <h1 className="font-display text-4xl">Yeni ürün</h1>
      <p className="mt-2 text-sm text-muted">Yayın kutusunu boş bırakırsanız kayıt taslak kalır.</p>
      <div className="mt-6 max-w-4xl">
        <ProductForm
          id={null}
          categories={categories}
          specFields={[]}
          values={{
            name: "",
            slug: slugify("yeni-urun"),
            sku: "",
            categoryId: categories[0]?.id ?? "",
            description: "",
            profileType: "",
            sectionShape: "",
            widthMm: "",
            heightMm: "",
            thicknessMm: "",
            lengthMm: "",
            materialGrade: "",
            weightPerMeter: "",
            unit: "METER",
            stockStatus: "MADE_TO_ORDER",
            minOrderQty: "1",
            featured: false,
            published: false,
            seoTitle: "",
            seoDescription: "",
            specs: {},
          }}
        />
      </div>
    </div>
  );
}
