import "server-only";
import type { Prisma, StockStatus, Unit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isStockStatus } from "@/lib/units";

export const PAGE_SIZE = 12;

export type CatalogQuery = {
  q?: string;
  kategori?: string;
  profil?: string;
  kalite?: string;
  stok?: string;
  yuzey?: string;
  enMin?: string;
  enMax?: string;
  boyMin?: string;
  boyMax?: string;
  etMin?: string;
  etMax?: string;
  siralama?: string;
  sayfa?: string;
};

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  unit: Unit;
  unitPrice: string | null;
  minOrderQty: string;
  stockStatus: StockStatus;
  profileType: string | null;
  materialGrade: string | null;
  widthMm: string | null;
  heightMm: string | null;
  thicknessMm: string | null;
  weightPerMeter: string | null;
  imageUrl: string | null;
  imageAlt: string;
  categoryName: string;
  categorySlug: string;
};

function text(value: { toString(): string } | null | undefined): string | null {
  if (value == null) return null;
  return value.toString();
}

function numberFilter(min?: string, max?: string): Prisma.DecimalFilter | undefined {
  const filter: Prisma.DecimalFilter = {};
  if (min && /^\d+([.]\d+)?$/.test(min)) filter.gte = min;
  if (max && /^\d+([.]\d+)?$/.test(max)) filter.lte = max;
  return Object.keys(filter).length ? filter : undefined;
}

export function hasActiveFilters(query: CatalogQuery): boolean {
  return Boolean(
    query.q ||
      query.kategori ||
      query.profil ||
      query.kalite ||
      query.stok ||
      query.yuzey ||
      query.enMin ||
      query.enMax ||
      query.boyMin ||
      query.boyMax ||
      query.etMin ||
      query.etMax ||
      (query.sayfa && query.sayfa !== "1") ||
      (query.siralama && query.siralama !== "yeni"),
  );
}

async function categoryIdsForSlug(slug: string | undefined): Promise<string[] | undefined> {
  if (!slug) return undefined;
  const category = await prisma.category.findFirst({
    where: { slug, published: true },
    select: { id: true, children: { where: { published: true }, select: { id: true } } },
  });
  if (!category) return [];
  return [category.id, ...category.children.map((child) => child.id)];
}

function orderBy(sort: string | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "ad":
      return [{ name: "asc" }];
    case "ad-azalan":
      return [{ name: "desc" }];
    case "kod":
      return [{ sku: "asc" }];
    case "agirlik":
      return [{ weightPerMeter: "asc" }, { name: "asc" }];
    default:
      return [{ updatedAt: "desc" }];
  }
}

const cardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  unit: true,
  unitPrice: true,
  minOrderQty: true,
  stockStatus: true,
  profileType: true,
  materialGrade: true,
  widthMm: true,
  heightMm: true,
  thicknessMm: true,
  weightPerMeter: true,
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: { sortOrder: "asc" as const },
    take: 1,
    select: { alt: true, media: { select: { url: true } } },
  },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(row: CardRow): ProductCard {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    unit: row.unit,
    unitPrice: text(row.unitPrice),
    minOrderQty: row.minOrderQty.toString(),
    stockStatus: row.stockStatus,
    profileType: row.profileType,
    materialGrade: row.materialGrade,
    widthMm: text(row.widthMm),
    heightMm: text(row.heightMm),
    thicknessMm: text(row.thicknessMm),
    weightPerMeter: text(row.weightPerMeter),
    imageUrl: row.images[0]?.media.url ?? null,
    imageAlt: row.images[0]?.alt || row.name,
    categoryName: row.category.name,
    categorySlug: row.category.slug,
  };
}

export async function queryProducts(query: CatalogQuery, forcedCategorySlug?: string) {
  const page = Math.max(1, Number(query.sayfa) || 1);
  const categorySlug = forcedCategorySlug || query.kategori;
  const ids = await categoryIdsForSlug(categorySlug);
  const where: Prisma.ProductWhereInput = { published: true };
  if (ids) where.categoryId = { in: ids };
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (query.profil) where.profileType = query.profil;
  if (query.kalite) where.materialGrade = query.kalite;
  if (query.stok && isStockStatus(query.stok)) where.stockStatus = query.stok;
  if (query.yuzey) where.specs = { path: ["surface"], equals: query.yuzey };
  const width = numberFilter(query.enMin, query.enMax);
  const height = numberFilter(query.boyMin, query.boyMax);
  const thickness = numberFilter(query.etMin, query.etMax);
  if (width) where.widthMm = width;
  if (height) where.heightMm = height;
  if (thickness) where.thicknessMm = thickness;

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy: orderBy(query.siralama),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return {
    items: rows.map(toCard),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getFilterOptions() {
  const [profiles, grades, surfaces, categories] = await Promise.all([
    prisma.product.findMany({
      where: { published: true, profileType: { not: null } },
      distinct: ["profileType"],
      select: { profileType: true },
      orderBy: { profileType: "asc" },
    }),
    prisma.product.findMany({
      where: { published: true, materialGrade: { not: null } },
      distinct: ["materialGrade"],
      select: { materialGrade: true },
      orderBy: { materialGrade: "asc" },
    }),
    prisma.$queryRaw<{ surface: string }[]>`
      SELECT DISTINCT specs->>'surface' AS surface
      FROM "Product"
      WHERE published = true AND specs->>'surface' IS NOT NULL AND specs->>'surface' <> ''
      ORDER BY surface
    `,
    prisma.category.findMany({
      where: { published: true },
      select: { name: true, slug: true, parentId: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return {
    profiles: profiles.flatMap((row) => (row.profileType ? [row.profileType] : [])),
    grades: grades.flatMap((row) => (row.materialGrade ? [row.materialGrade] : [])),
    surfaces: surfaces.map((row) => row.surface),
    categories,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, published: true },
    include: {
      category: { select: { id: true, name: true, slug: true, parentId: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        include: { media: { select: { url: true } } },
      },
    },
  });
  if (!product) return null;
  const relatedLimit = 4;
  const sameCategory = await prisma.product.findMany({
    where: { published: true, categoryId: product.categoryId, id: { not: product.id } },
    select: cardSelect,
    take: relatedLimit,
    orderBy: { updatedAt: "desc" },
  });
  const fillers =
    sameCategory.length < relatedLimit
      ? await prisma.product.findMany({
          where: {
            published: true,
            id: { notIn: [product.id, ...sameCategory.map((item) => item.id)] },
          },
          select: cardSelect,
          take: relatedLimit - sameCategory.length,
          orderBy: { updatedAt: "desc" },
        })
      : [];
  const related = [...sameCategory, ...fillers];
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    profileType: product.profileType,
    sectionShape: product.sectionShape,
    widthMm: text(product.widthMm),
    heightMm: text(product.heightMm),
    thicknessMm: text(product.thicknessMm),
    lengthMm: text(product.lengthMm),
    materialGrade: product.materialGrade,
    weightPerMeter: text(product.weightPerMeter),
    unit: product.unit,
    unitPrice: text(product.unitPrice),
    stockStatus: product.stockStatus,
    minOrderQty: product.minOrderQty.toString(),
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    specs: (product.specs ?? {}) as Record<string, string>,
    category: product.category,
    images: product.images.map((image) => ({
      url: image.media.url,
      alt: image.alt || product.name,
    })),
    related: related.map(toCard),
    updatedAt: product.updatedAt,
  };
}

export async function getFeaturedProducts() {
  const rows = await prisma.product.findMany({
    where: { published: true, featured: true },
    select: cardSelect,
    take: 3,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toCard);
}

export async function getPublishedCategories() {
  return prisma.category.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      image: { select: { url: true, alt: true } },
      children: {
        where: { published: true },
        select: {
          name: true,
          slug: true,
          _count: { select: { products: { where: { published: true } } } },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { products: { where: { published: true } } } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: { slug, published: true },
    include: {
      image: { select: { url: true, alt: true } },
      parent: { select: { name: true, slug: true } },
    },
  });
}

export async function findRedirect(fromPath: string) {
  return prisma.redirect.findFirst({
    where: { fromPath, active: true },
    select: { toPath: true, statusCode: true },
  });
}
