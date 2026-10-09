import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { AddToQuote } from "@/components/quote/add-to-quote";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Gallery } from "@/components/site/gallery";
import { ProductCard } from "@/components/site/product-card";
import { findRedirect, getProductBySlug } from "@/lib/catalog";
import { catalogPhoto } from "@/lib/catalog-photos";
import { decimalPlacesForUnit, formatQuantity } from "@/lib/quantity";
import { absoluteUrl, jsonLdScript } from "@/lib/site";
import { getCompany } from "@/lib/settings";
import { STOCK_LABELS, UNIT_LABELS } from "@/lib/units";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün" };
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description.slice(0, 160),
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: { title: product.seoTitle || product.name, description: product.seoDescription || product.description.slice(0, 160) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    const jump = await findRedirect(`/urun/${slug}`);
    if (jump) {
      if (jump.statusCode === 302) redirect(jump.toPath);
      permanentRedirect(jump.toPath);
    }
    notFound();
  }
  const company = await getCompany();
  const places = decimalPlacesForUnit(product.unit);
  const unitLabel = UNIT_LABELS[product.unit];
  const rows = [
    ["Ürün kodu", product.sku],
    ["Profil türü", product.profileType],
    ["Kesit", product.sectionShape],
    ["En", product.widthMm ? `${product.widthMm} mm` : null],
    ["Boy", product.heightMm ? `${product.heightMm} mm` : null],
    ["Et kalınlığı", product.thicknessMm ? `${product.thicknessMm} mm` : null],
    ["Standart boy", product.lengthMm ? `${product.lengthMm} mm` : null],
    ["Malzeme / kalite", product.materialGrade],
    ["Metre ağırlığı", product.weightPerMeter ? `${product.weightPerMeter} kg/m` : null],
    ["Satış birimi", unitLabel],
    ["Minimum miktar", `${formatQuantity(product.minOrderQty, places)} ${unitLabel}`],
    ["Stok durumu", STOCK_LABELS[product.stockStatus]],
    ...Object.entries(product.specs).map(([key, value]) => [key, value] as [string, string]),
  ].filter((row): row is [string, string] => Boolean(row[1]));
  const infoUrl = company.whatsapp
    ? buildWhatsAppUrl(
        company.whatsapp,
        `Merhaba, ${product.name} (kod: ${product.sku}) hakkında bilgi almak istiyorum.\n\nBu mesaj taslaktır; gönderilmeden firmaya ulaşmış sayılmaz.`,
      )
    : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    category: product.category.name,
    ...(product.images[0] ? { image: absoluteUrl(product.images[0].url) } : {}),
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <Breadcrumbs
        items={[
          { name: "Ana sayfa", path: "/" },
          { name: "Ürünler", path: "/urunler" },
          { name: product.category.name, path: `/kategori/${product.category.slug}` },
          { name: product.name, path: `/urun/${product.slug}` },
        ]}
      />
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <Gallery images={product.images} shape={product.profileType || product.sectionShape} />
        <div>
          <p className="text-sm text-muted">{product.category.name}</p>
          <h1 className="mt-1 font-display text-4xl">{product.name}</h1>
          <p className="mt-2 text-muted">Kod: {product.sku}</p>
          <p className="mt-4 leading-7">{product.description}</p>
          <p className="mt-4 rounded-md bg-zinc-100 p-3 text-sm">Fiyat teklif üzerine belirlenir. Birim dönüşümü yapılmaz.</p>
          <div className="mt-4 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
            {infoUrl ? (
              <a
                href={infoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#128C7E] px-3 py-2 text-center text-sm leading-tight font-semibold text-white transition hover:brightness-110"
              >
                WhatsApp&apos;tan bilgi al
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="WhatsApp numarası henüz tanımlanmadı."
                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-md bg-[#128C7E] px-3 py-2 text-center text-sm leading-tight font-semibold text-white opacity-60"
              >
                WhatsApp&apos;tan bilgi al
              </button>
            )}
            <AddToQuote
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                sku: product.sku,
                unit: product.unit,
                minOrderQty: product.minOrderQty,
                imageUrl: product.images[0]?.url ?? catalogPhoto(product.profileType),
                imageAlt: product.images[0]?.alt || product.name,
              }}
            />
          </div>
        </div>
      </div>
      <h2 className="mt-10 font-display text-3xl">Teknik özellikler</h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Teknik özellikler</caption>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-border last:border-0">
                <th scope="row" className="w-1/2 px-4 py-3 font-medium">{label}</th>
                <td className="px-4 py-3">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {product.related.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl">Benzer ürünler</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {product.related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
