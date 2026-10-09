"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { productSchema, fieldErrors } from "@/lib/validators";
import { fail, type ActionResult } from "@/lib/action-result";
import { isUniqueConstraint, publicErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { plainText } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";
import { isStockStatus, isUnit } from "@/lib/units";
import { parseProductCsv, PRODUCT_CSV_COLUMNS, toCsv } from "@/lib/csv";
import { deleteStoredFile, saveImage } from "@/lib/storage";

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function touchProduct(slug?: string, categorySlug?: string) {
  revalidatePath("/");
  revalidatePath("/urunler");
  if (slug) revalidatePath(`/urun/${slug}`);
  if (categorySlug) revalidatePath(`/kategori/${categorySlug}`);
}

function toData(input: ReturnType<typeof productSchema.parse>): Prisma.ProductUncheckedCreateInput {
  const specs = Object.fromEntries(
    Object.entries(input.specs ?? {})
      .map(([key, value]) => [key.trim(), value.trim()] as const)
      .filter(([key, value]) => key && value),
  );
  return {
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    categoryId: input.categoryId,
    description: plainText(input.description),
    profileType: emptyToNull(input.profileType),
    sectionShape: emptyToNull(input.sectionShape),
    widthMm: emptyToNull(input.widthMm),
    heightMm: emptyToNull(input.heightMm),
    thicknessMm: emptyToNull(input.thicknessMm),
    lengthMm: emptyToNull(input.lengthMm),
    materialGrade: emptyToNull(input.materialGrade),
    weightPerMeter: emptyToNull(input.weightPerMeter),
    unit: input.unit,
    stockStatus: input.stockStatus,
    minOrderQty: input.minOrderQty,
    featured: input.featured,
    published: input.published,
    seoTitle: emptyToNull(input.seoTitle),
    seoDescription: emptyToNull(input.seoDescription),
    specs,
  };
}

export async function saveProduct(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("products.write");
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return fail("Ürün formunu kontrol edin.", fieldErrors(parsed.error));
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true, slug: true },
    });
    if (!category) return fail("Kategori bulunamadı.");
    const data = toData(parsed.data);
    const product = id
      ? await prisma.product.update({ where: { id }, data, select: { id: true, slug: true, name: true } })
      : await prisma.product.create({ data, select: { id: true, slug: true, name: true } });
    await audit({
      userId: user.id,
      action: id ? "product.update" : "product.create",
      entity: "Product",
      entityId: product.id,
      summary: id ? `${product.name} güncellendi` : `${product.name} oluşturuldu`,
    });
    touchProduct(product.slug, category.slug);
    return { ok: true, data: { id: product.id } };
  } catch (error) {
    if (isUniqueConstraint(error)) return fail("Bu ürün kodu veya adres başka bir üründe kullanılıyor.");
    logger.error("product_save_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Ürün kaydedilemedi."));
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("products.write");
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, category: { select: { slug: true } } },
    });
    if (!product) return fail("Ürün bulunamadı.");
    await prisma.product.delete({ where: { id } });
    await audit({
      userId: user.id,
      action: "product.delete",
      entity: "Product",
      entityId: id,
      summary: `${product.name} silindi`,
    });
    touchProduct(product.slug, product.category.slug);
    return { ok: true };
  } catch (error) {
    logger.error("product_delete_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Ürün silinemedi."));
  }
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("products.write");
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return fail("Ürün bulunamadı.");
    let sku = `${product.sku}-KOPYA`;
    let slug = slugify(`${product.slug}-kopya`);
    let attempt = 2;
    while (await prisma.product.findFirst({ where: { OR: [{ sku }, { slug }] }, select: { id: true } })) {
      sku = `${product.sku}-KOPYA-${attempt}`;
      slug = slugify(`${product.slug}-kopya-${attempt}`);
      attempt += 1;
    }
    const copy = await prisma.product.create({
      data: {
        name: `${product.name} kopya`,
        slug,
        sku,
        categoryId: product.categoryId,
        description: product.description,
        profileType: product.profileType,
        sectionShape: product.sectionShape,
        widthMm: product.widthMm,
        heightMm: product.heightMm,
        thicknessMm: product.thicknessMm,
        lengthMm: product.lengthMm,
        materialGrade: product.materialGrade,
        weightPerMeter: product.weightPerMeter,
        unit: product.unit,
        stockStatus: product.stockStatus,
        minOrderQty: product.minOrderQty,
        featured: false,
        published: false,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        specs: product.specs ?? undefined,
      },
      select: { id: true },
    });
    await audit({
      userId: user.id,
      action: "product.duplicate",
      entity: "Product",
      entityId: copy.id,
      summary: `${product.name} kopyalandı`,
    });
    touchProduct();
    return { ok: true, data: { id: copy.id } };
  } catch (error) {
    logger.error("product_duplicate_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Ürün kopyalanamadı."));
  }
}

export async function bulkProducts(
  ids: string[],
  action: "publish" | "unpublish" | "feature" | "unfeature" | "delete",
): Promise<ActionResult> {
  try {
    const user = await requirePermission("products.write");
    const unique = [...new Set(ids)].slice(0, 200);
    if (!unique.length) return fail("Ürün seçin.");
    if (action === "delete") {
      await prisma.product.deleteMany({ where: { id: { in: unique } } });
    } else {
      const data =
        action === "publish"
          ? { published: true }
          : action === "unpublish"
            ? { published: false }
            : action === "feature"
              ? { featured: true }
              : { featured: false };
      await prisma.product.updateMany({ where: { id: { in: unique } }, data });
    }
    await audit({
      userId: user.id,
      action: "product.bulk",
      entity: "Product",
      summary: `${unique.length} ürün için ${action}`,
      metadata: { ids: unique, action },
    });
    touchProduct();
    return { ok: true };
  } catch (error) {
    logger.error("product_bulk_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Toplu işlem tamamlanamadı."));
  }
}

export async function uploadProductImage(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("products.write");
    const productId = String(formData.get("productId") ?? "");
    const alt = plainText(String(formData.get("alt") ?? "")).slice(0, 180);
    const file = formData.get("file");
    if (!productId) return fail("Ürün bulunamadı.");
    if (!(file instanceof File)) return fail("Görsel seçin.");
    if (!alt) return fail("Görsel için alternatif metin gerekli.");
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true },
    });
    if (!product) return fail("Ürün bulunamadı.");
    const stored = await saveImage(file);
    const last = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const media = await prisma.media.create({
      data: {
        filename: stored.filename,
        originalName: stored.filename,
        mimeType: stored.mimeType,
        size: stored.size,
        alt,
        storageKey: stored.storageKey,
        url: stored.url,
      },
    });
    await prisma.productImage.create({
      data: { productId, mediaId: media.id, alt, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
    await audit({
      userId: user.id,
      action: "product.image",
      entity: "Product",
      entityId: productId,
      summary: "Ürün görseli eklendi",
    });
    touchProduct(product.slug);
    return { ok: true };
  } catch (error) {
    logger.error("product_image_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Görsel yüklenemedi."));
  }
}

export async function moveProductImage(imageId: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    await requirePermission("products.write");
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) return fail("Görsel bulunamadı.");
    const sibling = await prisma.productImage.findFirst({
      where: {
        productId: image.productId,
        sortOrder: direction === "up" ? { lt: image.sortOrder } : { gt: image.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });
    if (!sibling) return { ok: true };
    await prisma.$transaction([
      prisma.productImage.update({ where: { id: image.id }, data: { sortOrder: sibling.sortOrder } }),
      prisma.productImage.update({ where: { id: sibling.id }, data: { sortOrder: image.sortOrder } }),
    ]);
    const product = await prisma.product.findUnique({ where: { id: image.productId }, select: { slug: true } });
    touchProduct(product?.slug);
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Sıra değiştirilemedi."));
  }
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("products.write");
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      include: { media: true, product: { select: { slug: true } } },
    });
    if (!image) return fail("Görsel bulunamadı.");
    await prisma.productImage.delete({ where: { id: imageId } });
    const stillUsed = await prisma.productImage.count({ where: { mediaId: image.mediaId } });
    if (stillUsed === 0) {
      await prisma.media.delete({ where: { id: image.mediaId } });
      await deleteStoredFile(image.media.storageKey, image.media.url);
    }
    await audit({
      userId: user.id,
      action: "product.image.delete",
      entity: "Product",
      entityId: image.productId,
      summary: "Ürün görseli silindi",
    });
    touchProduct(image.product.slug);
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Görsel silinemedi."));
  }
}

export async function importProductsCsv(formData: FormData): Promise<ActionResult<{ created: number; errors: string[] }>> {
  try {
    const user = await requirePermission("products.write");
    const file = formData.get("file");
    if (!(file instanceof File)) return fail("CSV dosyası seçin.");
    if (file.size > 2 * 1024 * 1024) return fail("CSV dosyası 2 MB sınırını aşıyor.");
    const text = await file.text();
    let rows;
    try {
      rows = parseProductCsv(text);
    } catch {
      return fail("CSV okunamadı. Sütun başlıklarını örnek dosyayla karşılaştırın.");
    }
    const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
    const bySlug = new Map(categories.map((category) => [category.slug, category.id]));
    let created = 0;
    const errors: string[] = [];
    for (const [index, row] of rows.entries()) {
      const line = index + 2;
      const categoryId = bySlug.get(row.categorySlug);
      if (!categoryId) {
        errors.push(`Satır ${line}: kategori bulunamadı (${row.categorySlug}).`);
        continue;
      }
      if (!isUnit(row.unit) || !isStockStatus(row.stockStatus)) {
        errors.push(`Satır ${line}: birim veya stok durumu geçersiz.`);
        continue;
      }
      const parsed = productSchema.safeParse({
        ...row,
        categoryId,
        featured: row.featured === "true" || row.featured === "1",
        published: row.published === "true" || row.published === "1",
        specs: {},
      });
      if (!parsed.success) {
        errors.push(`Satır ${line}: ${parsed.error.issues[0]?.message ?? "geçersiz"}.`);
        continue;
      }
      try {
        await prisma.product.create({ data: toData(parsed.data) });
        created += 1;
      } catch (error) {
        errors.push(
          isUniqueConstraint(error)
            ? `Satır ${line}: kod veya adres zaten var.`
            : `Satır ${line}: kaydedilemedi.`,
        );
      }
    }
    await audit({
      userId: user.id,
      action: "product.import",
      entity: "Product",
      summary: `${created} ürün CSV ile eklendi`,
    });
    touchProduct();
    return { ok: true, data: { created, errors: errors.slice(0, 30) } };
  } catch (error) {
    logger.error("product_import_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "İçe aktarma tamamlanamadı."));
  }
}

export async function buildProductCsv(): Promise<string> {
  await requirePermission("products.write");
  const products = await prisma.product.findMany({
    include: { category: { select: { slug: true } } },
    orderBy: { sku: "asc" },
  });
  const rows = [
    [...PRODUCT_CSV_COLUMNS],
    ...products.map((product) => [
      product.name,
      product.sku,
      product.slug,
      product.category.slug,
      product.description,
      product.profileType ?? "",
      product.sectionShape ?? "",
      product.widthMm?.toString() ?? "",
      product.heightMm?.toString() ?? "",
      product.thicknessMm?.toString() ?? "",
      product.lengthMm?.toString() ?? "",
      product.materialGrade ?? "",
      product.weightPerMeter?.toString() ?? "",
      product.unit,
      product.stockStatus,
      product.minOrderQty.toString(),
      String(product.featured),
      String(product.published),
      product.seoTitle ?? "",
      product.seoDescription ?? "",
    ]),
  ];
  return toCsv(rows);
}
