import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now },
    { url: absoluteUrl("/urunler"), lastModified: now },
  ];
  try {
    const [pages, products, categories] = await Promise.all([
      prisma.page.findMany({
        where: { published: true, robots: { startsWith: "index" } },
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    return [
      ...base,
      ...pages.map((page) => ({ url: absoluteUrl(`/${page.slug}`), lastModified: page.updatedAt })),
      ...categories.map((category) => ({ url: absoluteUrl(`/kategori/${category.slug}`), lastModified: category.updatedAt })),
      ...products.map((product) => ({ url: absoluteUrl(`/urun/${product.slug}`), lastModified: product.updatedAt })),
    ];
  } catch {
    return base;
  }
}
