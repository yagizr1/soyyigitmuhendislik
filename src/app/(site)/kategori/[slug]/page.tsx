import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { CatalogListing } from "@/components/site/catalog-listing";
import { findRedirect, getCategoryBySlug, getFilterOptions, hasActiveFilters, queryProducts, type CatalogQuery } from "@/lib/catalog";
import { one } from "@/lib/search";
import { plainText } from "@/lib/sanitize";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori" };
  const query = await searchParams;
  const filtered = hasActiveFilters({ sayfa: one(query.sayfa), q: one(query.q), siralama: one(query.siralama) });
  return {
    title: category.seoTitle || category.name,
    description: category.seoDescription || plainText(category.description ?? category.name).slice(0, 160),
    alternates: { canonical: `/kategori/${category.slug}` },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const query: CatalogQuery = {
    q: one(raw.q),
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
  const category = await getCategoryBySlug(slug);
  if (!category) {
    const jump = await findRedirect(`/kategori/${slug}`);
    if (jump) {
      if (jump.statusCode === 302) redirect(jump.toPath);
      permanentRedirect(jump.toPath);
    }
    notFound();
  }
  const [result, filters] = await Promise.all([
    queryProducts(query, category.slug),
    getFilterOptions(),
  ]);
  return (
    <CatalogListing
      title={category.name}
      description={category.description}
      action={`/kategori/${category.slug}`}
      query={query}
      categories={filters.categories}
      profiles={filters.profiles}
      grades={filters.grades}
      surfaces={filters.surfaces}
      items={result.items}
      page={result.page}
      pageCount={result.pageCount}
      hideCategory
      emptyMessage="Bu kategoride eşleşen ürün yok."
    />
  );
}
