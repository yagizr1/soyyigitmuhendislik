import Link from "next/link";

export function PaginationLinks({
  page,
  pageCount,
  path,
  query,
}: {
  page: number;
  pageCount: number;
  path: string;
  query: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;
  function href(nextPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (!value || key === "sayfa") continue;
      params.set(key, value);
    }
    if (nextPage > 1) params.set("sayfa", String(nextPage));
    const text = params.toString();
    return text ? `${path}?${text}` : path;
  }
  return (
    <nav aria-label="Sayfalama" className="mt-8 flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className="inline-flex h-11 items-center rounded-md border border-border bg-card px-4">
          Önceki
        </Link>
      ) : null}
      <p className="px-2 text-sm text-muted">
        Sayfa {page} / {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={href(page + 1)} className="inline-flex h-11 items-center rounded-md border border-border bg-card px-4">
          Sonraki
        </Link>
      ) : null}
    </nav>
  );
}
