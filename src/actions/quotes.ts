"use server";

import { revalidatePath } from "next/cache";
import type { QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { contactSchema, fieldErrors, quoteRequestSchema } from "@/lib/validators";
import { fail, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { assertActionRate } from "@/lib/rate-limit";
import { clientKey } from "@/lib/request-meta";
import { decimalPlacesForUnit, normalizeQuantity, quantityAtLeast } from "@/lib/quantity";
import { publicErrorMessage, UserFacingError } from "@/lib/errors";
import { plainText } from "@/lib/sanitize";

const STATUSES: QuoteStatus[] = ["NEW", "REVIEWING", "QUOTED", "COMPLETED", "CANCELLED"];

export async function createQuoteRequest(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await assertActionRate(await clientKey("quote"), 8, 60 * 60 * 1000);
    const parsed = quoteRequestSchema.safeParse(input);
    if (!parsed.success) return fail("Teklif formunu kontrol edin.", fieldErrors(parsed.error));
    const products = await prisma.product.findMany({
      where: { id: { in: parsed.data.items.map((item) => item.productId) }, published: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    const items = parsed.data.items.map((item, index) => {
      const product = byId.get(item.productId);
      if (!product) throw new UserFacingError("Listede yayında olmayan bir ürün var. Sayfayı yenileyin.");
      const quantity = normalizeQuantity(item.quantity, decimalPlacesForUnit(product.unit));
      if (!quantity) throw new UserFacingError(`${product.name} için miktar, birimine uygun değil.`);
      if (!quantityAtLeast(quantity, product.minOrderQty.toString())) {
        throw new UserFacingError(`${product.name} için minimum miktar ${product.minOrderQty.toString()}.`);
      }
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unit: product.unit,
        sortOrder: index,
      };
    });
    const quote = await prisma.quoteRequest.create({
      data: {
        source: "CART",
        companyName: plainText(parsed.data.companyName),
        contactName: plainText(parsed.data.contactName ?? ""),
        phone: plainText(parsed.data.phone ?? ""),
        email: parsed.data.email,
        note: plainText(parsed.data.note ?? ""),
        consent: true,
        items: { create: items },
      },
      select: { id: true },
    });
    revalidatePath("/admin/teklifler");
    return { ok: true, data: { id: quote.id } };
  } catch (error) {
    logger.error("quote_create_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "Talep kaydedilemedi."));
  }
}

export async function createContactRequest(input: unknown): Promise<ActionResult> {
  try {
    await assertActionRate(await clientKey("contact"), 8, 60 * 60 * 1000);
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) return fail("İletişim formunu kontrol edin.", fieldErrors(parsed.error));
    await prisma.quoteRequest.create({
      data: {
        source: "CONTACT",
        companyName: plainText(parsed.data.companyName),
        contactName: plainText(parsed.data.contactName ?? ""),
        phone: plainText(parsed.data.phone ?? ""),
        email: parsed.data.email,
        note: plainText(parsed.data.note),
        consent: true,
      },
    });
    revalidatePath("/admin/teklifler");
    return { ok: true };
  } catch (error) {
    logger.error("contact_create_failed", { name: error instanceof Error ? error.name : "unknown" });
    return fail(publicErrorMessage(error, "İleti kaydedilemedi."));
  }
}

export async function updateQuoteStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("quotes.write");
    if (!STATUSES.includes(status as QuoteStatus)) return fail("Durum geçersiz.");
    await prisma.quoteRequest.update({ where: { id }, data: { status: status as QuoteStatus } });
    await audit({
      userId: user.id,
      action: "quote.status",
      entity: "QuoteRequest",
      entityId: id,
      summary: `Talep durumu ${status} oldu`,
    });
    revalidatePath("/admin/teklifler");
    revalidatePath(`/admin/teklifler/${id}`);
    return { ok: true };
  } catch (error) {
    return fail(publicErrorMessage(error, "Durum güncellenemedi."));
  }
}
