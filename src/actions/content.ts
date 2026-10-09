"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { faqSchema, fieldErrors, homeSchema, pageSchema, seoSchema } from "@/lib/validators";
import { fail, type ActionResult } from "@/lib/action-result";
import { isUniqueConstraint, publicErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { plainText, sanitizeRichText } from "@/lib/sanitize";

function touchPage(slug: string) {
  revalidatePath("/");
  revalidatePath(`/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function savePage(id: string, input: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("pages.write");
    const parsed = pageSchema.safeParse(input);
    if (!parsed.success) return fail("Sayfa formunu kontrol edin.", fieldErrors(parsed.error));
    const content = sanitizeRichText(parsed.data.content);
    if (!plainText(content)) return fail("İçerik boş olamaz.");
    await prisma.page.update({
      where: { id },
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: plainText(parsed.data.excerpt ?? ""),
        content,
        published: parsed.data.published,
        showInNav: parsed.data.showInNav,
        showInFooter: parsed.data.showInFooter,
        navLabel: parsed.data.navLabel || null,
        sortOrder: parsed.data.sortOrder,
        seoTitle: parsed.data.seoTitle || null,
        seoDescription: parsed.data.seoDescription || null,
        canonicalPath: parsed.data.canonicalPath || null,
        ogTitle: parsed.data.ogTitle || null,
        robots: parsed.data.robots,
      },
    });
    await audit({
      userId: user.id,
      action: "page.update",
      entity: "Page",
      entityId: id,
      summary: `${parsed.data.title} güncellendi`,
    });
    touchPage(parsed.data.slug);
    return { ok: true };
  } catch (error) {
    if (isUniqueConstraint(error)) return fail("Bu sayfa adresi zaten kullanılıyor.");
    logger.error("page_save_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Sayfa kaydedilemedi."));
  }
}

export async function saveHome(input: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("homepage.write");
    const parsed = homeSchema.safeParse(input);
    if (!parsed.success) return fail("Ana sayfa alanlarını kontrol edin.", fieldErrors(parsed.error));
    await prisma.siteSetting.upsert({
      where: { key: "homepage" },
      create: { key: "homepage", value: parsed.data },
      update: { value: parsed.data },
    });
    await audit({
      userId: user.id,
      action: "homepage.update",
      entity: "SiteSetting",
      entityId: "homepage",
      summary: "Ana sayfa bölümleri güncellendi",
    });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Ana sayfa kaydedilemedi."));
  }
}

export async function saveFaq(id: string | null, input: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("faqs.write");
    const parsed = faqSchema.safeParse(input);
    if (!parsed.success) return fail("SSS formunu kontrol edin.", fieldErrors(parsed.error));
    const data = {
      question: plainText(parsed.data.question),
      answer: plainText(parsed.data.answer),
      sortOrder: parsed.data.sortOrder,
      published: parsed.data.published,
    };
    const faq = id
      ? await prisma.faq.update({ where: { id }, data })
      : await prisma.faq.create({ data });
    await audit({
      userId: user.id,
      action: id ? "faq.update" : "faq.create",
      entity: "Faq",
      entityId: faq.id,
      summary: "SSS kaydı güncellendi",
    });
    revalidatePath("/");
    revalidatePath("/sss");
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Soru kaydedilemedi."));
  }
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("faqs.write");
    await prisma.faq.delete({ where: { id } });
    await audit({ userId: user.id, action: "faq.delete", entity: "Faq", entityId: id, summary: "SSS silindi" });
    revalidatePath("/");
    revalidatePath("/sss");
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Soru silinemedi."));
  }
}

export async function saveSeo(input: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("seo.write");
    const parsed = seoSchema.safeParse(input);
    if (!parsed.success) return fail("SEO alanlarını kontrol edin.", fieldErrors(parsed.error));
    await prisma.seoMeta.upsert({
      where: { path: parsed.data.path },
      create: {
        path: parsed.data.path,
        title: parsed.data.title || null,
        description: parsed.data.description || null,
        canonical: parsed.data.canonical || null,
        ogTitle: parsed.data.ogTitle || null,
        robots: parsed.data.robots,
      },
      update: {
        title: parsed.data.title || null,
        description: parsed.data.description || null,
        canonical: parsed.data.canonical || null,
        ogTitle: parsed.data.ogTitle || null,
        robots: parsed.data.robots,
      },
    });
    await audit({
      userId: user.id,
      action: "seo.update",
      entity: "SeoMeta",
      entityId: parsed.data.path,
      summary: `${parsed.data.path} SEO kaydı güncellendi`,
    });
    revalidatePath(parsed.data.path);
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "SEO kaydı saklanamadı."));
  }
}
