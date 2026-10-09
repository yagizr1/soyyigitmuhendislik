import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { absoluteUrl, jsonLdScript } from "@/lib/site";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
  return (
    <nav aria-label="Sayfa konumu">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight aria-hidden="true" className="size-3.5 text-muted" /> : null}
            {index === items.length - 1 ? (
              <span aria-current="page" className="font-medium text-accent">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="text-muted transition hover:text-foreground">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
    </nav>
  );
}
