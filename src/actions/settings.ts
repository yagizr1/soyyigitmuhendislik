"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { brandSchema, companySchema, fieldErrors, redirectSchema, socialSchema } from "@/lib/validators";
import { fail, type ActionResult } from "@/lib/action-result";
import { isUniqueConstraint, publicErrorMessage } from "@/lib/errors";
import { plainText } from "@/lib/sanitize";

export async function saveCompany(input: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("settings.write");
    const parsed = companySchema.safeParse(input);
    if (!parsed.success) return fail("Firma bilgilerini kontrol edin.", fieldErrors(parsed.error));
    const value = {
      ...parsed.data,
      legalName: plainText(parsed.data.legalName ?? ""),
      phone: plainText(parsed.data.phone ?? ""),
      address: plainText(parsed.data.address ?? ""),
      city: plainText(parsed.data.city ?? ""),
      hours: plainText(parsed.data.hours ?? ""),
      footerNote: plainText(parsed.data.footerNote ?? ""),
    };
    await prisma.siteSetting.upsert({
      where: { key: "company" },
      create: { key: "company", value },
      update: { value },
    });
    await audit({
      userId: user.id,
      action: "settings.company",
      entity: "SiteSetting",
      entityId: "company",
      summary: "Firma bilgileri güncellendi",
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Firma bilgileri kaydedilemedi."));
  }
}

export async function saveSocial(input: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("settings.write");
    const parsed = socialSchema.safeParse(input);
    if (!parsed.success) return fail("Sosyal bağlantıları kontrol edin.", fieldErrors(parsed.error));
    await prisma.siteSetting.upsert({
      where: { key: "social" },
      create: { key: "social", value: parsed.data },
      update: { value: parsed.data },
    });
    await audit({
      userId: user.id,
      action: "settings.social",
      entity: "SiteSetting",
      entityId: "social",
      summary: "Sosyal bağlantılar güncellendi",
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Sosyal bağlantılar kaydedilemedi."));
  }
}

export async function saveBrand(input: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("settings.write");
    const parsed = brandSchema.safeParse(input);
    if (!parsed.success) return fail("Marka ayarlarını kontrol edin.", fieldErrors(parsed.error));
    await prisma.siteSetting.upsert({
      where: { key: "brand" },
      create: { key: "brand", value: parsed.data },
      update: { value: parsed.data },
    });
    await audit({
      userId: user.id,
      action: "settings.brand",
      entity: "SiteSetting",
      entityId: "brand",
      summary: "Marka ayarları güncellendi",
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Marka ayarları kaydedilemedi."));
  }
}

export async function saveRedirect(id: string | null, input: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("redirects.write");
    const parsed = redirectSchema.safeParse(input);
    if (!parsed.success) return fail("Yönlendirmeyi kontrol edin.", fieldErrors(parsed.error));
    const data = parsed.data;
    const row = id
      ? await prisma.redirect.update({ where: { id }, data })
      : await prisma.redirect.create({ data });
    await audit({
      userId: user.id,
      action: id ? "redirect.update" : "redirect.create",
      entity: "Redirect",
      entityId: row.id,
      summary: `${data.fromPath} yönlendirmesi kaydedildi`,
    });
    return { ok: true };
  } catch (error) {
    if (isUniqueConstraint(error)) return fail("Bu kaynak yolu zaten tanımlı.");
    return fail(publicErrorMessage(error, "Yönlendirme kaydedilemedi."));
  }
}

export async function deleteRedirect(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("redirects.write");
    await prisma.redirect.delete({ where: { id } });
    await audit({
      userId: user.id,
      action: "redirect.delete",
      entity: "Redirect",
      entityId: id,
      summary: "Yönlendirme silindi",
    });
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Yönlendirme silinemedi."));
  }
}
