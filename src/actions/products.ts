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
import { parseProductSheet, ProductSheetError, buildProductSheet, type ProductSheetRow } from "@/lib/product-sheet";
import { slugify } from "@/lib/slug";
import { isStockStatus, isUnit } from "@/lib/units";
import { deleteStoredFile, saveImage } from "@/lib/storage";

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function touchProduct(slug?: string, categorySlug?: string) {
  revalidatePath("/");
  revalidatePath("/urunler");
  revalidatePath("/admin/urunler");
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
    unitPrice: emptyToNull(input.unitPrice),
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

function categoryIdFor(
  value: string,
  categories: { id: string; slug: string; name: string }[],
): string | null | "ambiguous" {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  const bySlug = categories.filter((category) => category.slug === trimmed || category.slug === slug);
  if (bySlug.length === 1) return bySlug[0].id;
  const needle = trimmed.toLocaleLowerCase("tr-TR");
  const byName = categories.filter((category) => category.name.trim().toLocaleLowerCase("tr-TR") === needle);
  if (byName.length === 1) return byName[0].id;
  if (bySlug.length > 1 || byName.length > 1) return "ambiguous";
  return null;
}

export async function importProductsXlsx(formData: FormData): Promise<ActionResult<{ created: number; errors: string[] }>> {
  try {
    const user = await requirePermission("products.write");
    const file = formData.get("file");
    if (!(file instanceof File)) return fail("Excel dosyası seçin.");
    const filename = file.name.toLowerCase();
    if (!filename.endsWith(".xls") && !filename.endsWith(".xlsx")) return fail("Dosya .xls veya .xlsx olmalı.");
    if (file.size > 5 * 1024 * 1024) return fail("Excel dosyası 5 MB sınırını aşıyor.");
    let rows;
    try {
      rows = await parseProductSheet(new Uint8Array(await file.arrayBuffer()));
    } catch (error) {
      if (error instanceof ProductSheetError) return fail(error.message);
      return fail("Excel okunamadı. Sütun başlıklarını indirilen dosyayla karşılaştırın.");
    }
    if (rows.length === 0) return fail("Listede eklenecek ürün satırı yok.");
    const categories = await prisma.category.findMany({ select: { id: true, slug: true, name: true } });
    let created = 0;
    const errors: string[] = [];
    for (const item of rows) {
      const { line, row } = item;
      const categoryId = categoryIdFor(row.categorySlug, categories);
      if (categoryId === "ambiguous") {
        errors.push(`Satır ${line}: birden fazla kategori eşleşti (${row.categorySlug}).`);
        continue;
      }
      if (!categoryId) {
        errors.push(`Satır ${line}: kategori bulunamadı (${row.categorySlug || "boş"}).`);
        continue;
      }
      if (!row.unit.trim()) {
        errors.push(`Satır ${line}: birim gerekli (adet, metre, kilogram veya ton).`);
        continue;
      }
      if (!isUnit(row.unit) || !isStockStatus(row.stockStatus)) {
        errors.push(`Satır ${line}: birim veya stok durumu geçersiz.`);
        continue;
      }
      const parsed = productSchema.safeParse({
        ...row,
        categoryId,
        featured: row.featured === "true",
        published: row.published === "true",
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
      summary: `${created} ürün Excel ile eklendi`,
    });
    touchProduct();
    return { ok: true, data: { created, errors: errors.slice(0, 30) } };
  } catch (error) {
    logger.error("product_import_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "İçe aktarma tamamlanamadı."));
  }
}

export async function buildProductWorkbook(): Promise<Buffer> {
  await requirePermission("products.write");
  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { sku: "asc" },
  });
  const rows: ProductSheetRow[] = products.map((product) => ({
    name: product.name,
    sku: product.sku,
    slug: product.slug,
    categorySlug: product.category.name,
    description: product.description,
    profileType: product.profileType ?? "",
    sectionShape: product.sectionShape ?? "",
    widthMm: product.widthMm?.toString() ?? "",
    heightMm: product.heightMm?.toString() ?? "",
    thicknessMm: product.thicknessMm?.toString() ?? "",
    lengthMm: product.lengthMm?.toString() ?? "",
    materialGrade: product.materialGrade ?? "",
    weightPerMeter: product.weightPerMeter?.toString() ?? "",
    unit: product.unit,
    stockStatus: product.stockStatus,
    minOrderQty: product.minOrderQty.toString(),
    featured: String(product.featured),
    published: String(product.published),
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
  }));
  return buildProductSheet(rows);
}
