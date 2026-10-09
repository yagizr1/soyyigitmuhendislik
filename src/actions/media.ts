"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { fail, type ActionResult } from "@/lib/action-result";
import { publicErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { plainText } from "@/lib/sanitize";
import { deleteStoredFile, saveImage } from "@/lib/storage";

export async function uploadMedia(formData: FormData): Promise<ActionResult<{ id: string; url: string }>> {
  try {
    const user = await requirePermission("media.write");
    const file = formData.get("file");
    const alt = plainText(String(formData.get("alt") ?? "")).slice(0, 180);
    if (!(file instanceof File)) return fail("Dosya seçin.");
    const stored = await saveImage(file);
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
    await audit({
      userId: user.id,
      action: "media.create",
      entity: "Media",
      entityId: media.id,
      summary: "Görsel yüklendi",
    });
    revalidatePath("/admin/medya");
    return { ok: true, data: { id: media.id, url: media.url } };
  } catch (error) {
    logger.error("media_upload_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Görsel yüklenemedi."));
  }
}

export async function updateMediaAlt(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("media.write");
    const alt = plainText(String(formData.get("alt") ?? "")).slice(0, 180);
    await prisma.media.update({ where: { id }, data: { alt } });
    await audit({ userId: user.id, action: "media.alt", entity: "Media", entityId: id, summary: "Alternatif metin güncellendi" });
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Alternatif metin kaydedilemedi."));
  }
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("media.write");
    const [images, categories] = await Promise.all([
      prisma.productImage.count({ where: { mediaId: id } }),
      prisma.category.count({ where: { imageId: id } }),
    ]);
    if (images > 0 || categories > 0) {
      return fail("Görsel bir ürün veya kategoride kullanılıyor. Önce oradan kaldırın.");
    }
    const media = await prisma.media.delete({ where: { id } });
    await deleteStoredFile(media.storageKey, media.url);
    await audit({ userId: user.id, action: "media.delete", entity: "Media", entityId: id, summary: "Görsel silindi" });
    revalidatePath("/admin/medya");
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Görsel silinemedi."));
  }
}
