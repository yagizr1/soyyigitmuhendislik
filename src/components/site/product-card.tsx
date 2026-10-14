import Link from "next/link";
import { AddToQuote } from "@/components/quote/add-to-quote";
import { ProfileArt } from "@/components/site/profile-art";
import { SafeImage } from "@/components/site/safe-image";
import { catalogPhoto } from "@/lib/catalog-photos";
import { Badge } from "@/components/ui/badge";
import type { ProductCard as ProductCardData } from "@/lib/catalog";
import { formatTry } from "@/lib/money";
import { formatQuantity, decimalPlacesForUnit } from "@/lib/quantity";
import { STOCK_LABELS, UNIT_LABELS } from "@/lib/units";

export async function ProductCard({ product }: { product: ProductCardData }) {
  const places = decimalPlacesForUnit(product.unit);
  const imageUrl = product.imageUrl || catalogPhoto(product.profileType);
  const measures = [product.widthMm, product.heightMm, product.thicknessMm].filter(Boolean).join("×");
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <Link href={`/urun/${product.slug}`} className="relative block aspect-[4/3] bg-zinc-100">
        {imageUrl ? (
          <SafeImage src={imageUrl} alt={product.imageAlt || product.name} sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <ProfileArt shape={product.profileType} className="h-full w-full" />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs tracking-wide text-muted uppercase">{product.categoryName}</p>
          <h2 className="mt-1 font-display text-2xl leading-tight">
            <Link href={`/urun/${product.slug}`}>{product.name}</Link>
          </h2>
          <p className="mt-1 text-sm text-muted">Kod: {product.sku}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {measures ? (
            <div>
              <dt className="text-muted">Ölçü (mm)</dt>
              <dd>{measures}</dd>
            </div>
          ) : null}
          {product.materialGrade ? (
            <div>
              <dt className="text-muted">Kalite</dt>
              <dd>{product.materialGrade}</dd>
            </div>
          ) : null}
          {product.weightPerMeter ? (
            <div>
              <dt className="text-muted">kg/m</dt>
              <dd>{product.weightPerMeter}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Badge>{STOCK_LABELS[product.stockStatus]}</Badge>
          {product.unitPrice ? <Badge>{formatTry(Number(product.unitPrice))} / {UNIT_LABELS[product.unit]}</Badge> : null}
          <Badge>Min. {formatQuantity(product.minOrderQty, places)} {UNIT_LABELS[product.unit]}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <AddToQuote
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              unit: product.unit,
              minOrderQty: product.minOrderQty,
              imageUrl,
              imageAlt: product.imageAlt,
            }}
          />
        </div>
      </div>
    </article>
  );
}
