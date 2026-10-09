import { CatalogFilters } from "@/components/site/catalog-filters";
import { PaginationLinks } from "@/components/site/pagination-links";
import { ProductCard } from "@/components/site/product-card";
import { ProductSearch } from "@/components/site/product-search";
import type { CatalogQuery, ProductCard as ProductCardData } from "@/lib/catalog";

export function CatalogListing({
  title,
  description,
  action,
  query,
  categories,
  profiles,
  grades,
  surfaces,
  items,
  page,
  pageCount,
  hideCategory = false,
  emptyMessage,
}: {
  title: string;
  description?: string | null;
  action: string;
  query: CatalogQuery;
  categories: { slug: string; name: string }[];
  profiles: string[];
  grades: string[];
  surfaces: string[];
  items: ProductCardData[];
  page: number;
  pageCount: number;
  hideCategory?: boolean;
  emptyMessage: string;
}) {
  return (
    <div className="w-full px-4 pb-8 lg:px-6">
      <div className="grid items-start gap-x-4 gap-y-2 lg:grid-cols-[17rem_2.5rem_repeat(4,minmax(0,1fr))]">
        <div className="order-2 mt-5 flex justify-center lg:order-none lg:col-span-4 lg:col-start-3 lg:row-start-1 lg:mt-0 lg:min-h-32 lg:items-center">
          <ProductSearch action={action} query={query} />
        </div>
        <div className="order-1 mt-6 lg:order-none lg:col-span-4 lg:col-start-3 lg:row-start-2 lg:mt-0">
          <h1 className="font-display text-4xl leading-none tracking-tight">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-3">
          <CatalogFilters
            action={action}
            query={query}
            categories={categories}
            profiles={profiles}
            grades={grades}
            surfaces={surfaces}
            hideCategory={hideCategory}
            hideSearch
            formId="katalog-filtre"
          />
        </div>
        <div className="order-4 lg:order-none lg:col-span-4 lg:col-start-3 lg:row-start-3">
          {items.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-6">{emptyMessage}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <PaginationLinks page={page} pageCount={pageCount} path={action} query={query} />
        </div>
      </div>
    </div>
  );
}
