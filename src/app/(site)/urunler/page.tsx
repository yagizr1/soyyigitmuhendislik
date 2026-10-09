import type { Metadata } from "next";
import { CatalogListing } from "@/components/site/catalog-listing";
import { getFilterOptions, hasActiveFilters, queryProducts, type CatalogQuery } from "@/lib/catalog";
import { getSeo } from "@/lib/content";
import { one } from "@/lib/search";

function toQuery(raw: Record<string, string | string[] | undefined>): CatalogQuery {
  return {
    q: one(raw.q),
    kategori: one(raw.kategori),
    profil: one(raw.profil),
    kalite: one(raw.kalite),
    stok: one(raw.stok),
    yuzey: one(raw.yuzey),
    enMin: one(raw.enMin),
    enMax: one(raw.enMax),
    boyMin: one(raw.boyMin),
    boyMax: one(raw.boyMax),
    etMin: one(raw.etMin),
    etMax: one(raw.etMax),
    siralama: one(raw.siralama),
    sayfa: one(raw.sayfa),
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const query = toQuery(await searchParams);
  const seo = await getSeo("/urunler");
  const filtered = hasActiveFilters(query);
  return {
    title: seo?.title || "Ürünler",
    description: seo?.description || "Demir profil kataloğunda ada, koda ve ölçüye göre arama yapın.",
    alternates: { canonical: "/urunler" },
    robots: filtered || seo?.robots?.startsWith("noindex") ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = toQuery(await searchParams);
  const [result, filters] = await Promise.all([queryProducts(query), getFilterOptions()]);
  return (
    <CatalogListing
      title="Ürünler"
      action="/urunler"
      query={query}
      categories={filters.categories}
      profiles={filters.profiles}
      grades={filters.grades}
      surfaces={filters.surfaces}
      items={result.items}
      page={result.page}
      pageCount={result.pageCount}
      emptyMessage="Bu filtreyle eşleşen yayındaki ürün yok."
    />
  );
}
