"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { categorySchema, fieldErrors } from "@/lib/validators";
import { fail, type ActionResult } from "@/lib/action-result";
import { isUniqueConstraint, publicErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { plainText } from "@/lib/sanitize";

const specFieldsSchema = z
  .array(
    z.object({
      key: z
        .string()
        .trim()
        .min(1)
        .max(40)
        .regex(/^[a-z][a-z0-9_]*$/, "Alan anahtarı küçük harf ve alt çizgi olmalı."),
      label: z.string().trim().min(1).max(80),
      unit: z.string().trim().max(20).optional().or(z.literal("")),
      filterable: z.boolean(),
      sortOrder: z.number().int().min(0).max(100),
    }),
  )
  .max(20);

function touchCategory(slug?: string) {
  revalidatePath("/");
  revalidatePath("/urunler");
  if (slug) revalidatePath(`/kategori/${slug}`);
}

export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("categories.write");
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return fail("Kategori formunu kontrol edin.", fieldErrors(parsed.error));
    if (parsed.data.parentId && parsed.data.parentId === id) return fail("Kategori kendi alt kategorisi olamaz.");
    if (parsed.data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parsed.data.parentId }, select: { id: true, parentId: true } });
      if (!parent) return fail("Üst kategori bulunamadı.");
      if (parent.parentId) return fail("Yalnızca iki düzey kategori kullanılabilir.");
    }
    const data = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: plainText(parsed.data.description ?? ""),
      parentId: parsed.data.parentId || null,
      sortOrder: parsed.data.sortOrder,
      published: parsed.data.published,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
      imageId: parsed.data.imageId || null,
    };
    const category = id
      ? await prisma.category.update({ where: { id }, data, select: { id: true, slug: true, name: true } })
      : await prisma.category.create({ data, select: { id: true, slug: true, name: true } });
    await audit({
      userId: user.id,
      action: id ? "category.update" : "category.create",
      entity: "Category",
      entityId: category.id,
      summary: `${category.name} kaydedildi`,
    });
    touchCategory(category.slug);
    return { ok: true, data: { id: category.id } };
  } catch (error) {
    if (isUniqueConstraint(error)) return fail("Bu kategori adresi zaten kullanılıyor.");
    logger.error("category_save_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Kategori kaydedilemedi."));
  }
}

export async function saveCategorySpecFields(categoryId: string, input: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("categories.write");
    const parsed = specFieldsSchema.safeParse(input);
    if (!parsed.success) return fail("Teknik alanları kontrol edin.", fieldErrors(parsed.error));
    const keys = new Set(parsed.data.map((field) => field.key));
    if (keys.size !== parsed.data.length) return fail("Alan anahtarları benzersiz olmalı.");
    await prisma.$transaction([
      prisma.categorySpecField.deleteMany({ where: { categoryId } }),
      prisma.categorySpecField.createMany({
        data: parsed.data.map((field) => ({
          categoryId,
          key: field.key,
          label: field.label,
          unit: field.unit || null,
          filterable: field.filterable,
          sortOrder: field.sortOrder,
        })),
      }),
    ]);
    await audit({
      userId: user.id,
      action: "category.specs",
      entity: "Category",
      entityId: categoryId,
      summary: "Kategori teknik alanları güncellendi",
    });
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Teknik alanlar kaydedilemedi."));
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("categories.write");
    const [products, children] = await Promise.all([
      prisma.product.count({ where: { categoryId: id } }),
      prisma.category.count({ where: { parentId: id } }),
    ]);
    if (products > 0) return fail("Bu kategoride ürün var. Önce ürünleri taşıyın veya silin.");
    if (children > 0) return fail("Alt kategoriler varken üst kategori silinemez.");
    const category = await prisma.category.delete({ where: { id }, select: { name: true, slug: true } });
    await audit({
      userId: user.id,
      action: "category.delete",
      entity: "Category",
      entityId: id,
      summary: `${category.name} silindi`,
    });
    touchCategory(category.slug);
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Kategori silinemedi."));
  }
}
