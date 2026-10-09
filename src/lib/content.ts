import "server-only";
import { prisma } from "@/lib/prisma";

export async function getPublishedPage(slug: string) {
  return prisma.page.findFirst({ where: { slug, published: true } });
}

export async function getNavPages() {
  return prisma.page.findMany({
    where: { published: true, showInNav: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { slug: true, title: true, navLabel: true },
  });
}

export async function getFooterPages() {
  return prisma.page.findMany({
    where: { published: true, showInFooter: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { slug: true, title: true, navLabel: true },
  });
}

export async function getPublishedFaqs() {
  return prisma.faq.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, question: true, answer: true },
  });
}

export async function getSeo(path: string) {
  return prisma.seoMeta.findUnique({ where: { path } });
}

const STATIC_PATHS = new Set([
  "/",
  "/urunler",
  "/teklif",
  "/hakkimizda",
  "/kalite-ve-hizmetler",
  "/sektorler",
  "/sss",
  "/iletisim",
  "/gizlilik-politikasi",
  "/kvkk",
  "/cerez-politikasi",
  "/kullanim-kosullari",
]);

export async function findBrokenInternalLinks(): Promise<{ page: string; href: string }[]> {
  const pages = await prisma.page.findMany({ select: { slug: true, title: true, content: true } });
  const [pageSlugs, productSlugs, categorySlugs] = await Promise.all([
    prisma.page.findMany({ where: { published: true }, select: { slug: true } }),
    prisma.product.findMany({ where: { published: true }, select: { slug: true } }),
    prisma.category.findMany({ where: { published: true }, select: { slug: true } }),
  ]);
  const known = new Set<string>([
    ...STATIC_PATHS,
    ...pageSlugs.map((page) => `/${page.slug}`),
    ...productSlugs.map((product) => `/urun/${product.slug}`),
    ...categorySlugs.map((category) => `/kategori/${category.slug}`),
  ]);
  const broken: { page: string; href: string }[] = [];
  const hrefPattern = /href="(\/[^"]*)"/g;
  for (const page of pages) {
    for (const match of page.content.matchAll(hrefPattern)) {
      const href = match[1]?.split("?")[0]?.split("#")[0];
      if (!href || href.startsWith("/uploads") || href.startsWith("/admin")) continue;
      if (!known.has(href)) broken.push({ page: page.title, href });
    }
  }
  return broken;
}
