import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";
import { addQuantities, normalizeQuantity, quantityAtLeast } from "@/lib/quantity";
import { buildQuoteMessage, buildWhatsAppUrl, normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { sanitizeRichText } from "@/lib/sanitize";
import { buildProductSheet, parseProductSheet } from "@/lib/product-sheet";
import * as XLSX from "xlsx";
import { can } from "@/lib/permissions";
import { passwordIssues } from "@/lib/password";

describe("slugify", () => {
  it("Türkçe karakterleri sadeleştirir", () => {
    expect(slugify("Kutu Profil 40x40")).toBe("kutu-profil-40x40");
    expect(slugify("İstanbul Şantiyesi")).toBe("istanbul-santiyesi");
    expect(slugify("I profil")).toBe("i-profil");
  });
});

describe("miktar", () => {
  it("adet için ondalığı reddeder ve metre ile kilogramı toplamaz", () => {
    expect(normalizeQuantity("2", 0)).toBe("2");
    expect(normalizeQuantity("2,5", 0)).toBeNull();
    expect(normalizeQuantity("12,50", 2)).toBe("12.50");
    expect(quantityAtLeast("6", "6")).toBe(true);
    expect(quantityAtLeast("5.9", "6")).toBe(false);
    expect(addQuantities("6", "1.5", 2)).toBe("7.5");
  });
});

describe("whatsapp", () => {
  it("seçilen ürün ve miktarla kodlanmış bağlantı üretir", () => {
    expect(normalizeWhatsAppNumber("+90 555 111 22 33")).toBe("+905551112233");
    expect(normalizeWhatsAppNumber("0555 111 22 33")).toBe("+905551112233");
    expect(normalizeWhatsAppNumber("905551112233")).toBe("+905551112233");
    expect(normalizeWhatsAppNumber("123")).toBeNull();
    const message = buildQuoteMessage({
      companyName: "Örnek Metal",
      items: [{ name: "40x40x2 mm Kare Profil", sku: "KP-40-40-2", quantity: "120", unitLabel: "metre" }],
    });
    expect(message).toContain("KP-40-40-2");
    expect(message).toContain("120 metre");
    expect(message).not.toContain("TL");
    const url = buildWhatsAppUrl("+905551112233", message);
    expect(url?.startsWith("https://wa.me/905551112233?text=")).toBe(true);
    expect(decodeURIComponent(url!.split("text=")[1] ?? "")).toContain("Örnek Metal");
  });
});

describe("güvenlik ve yetki", () => {
  it("zengin metinden betik temizler ve editörün ayar yetkisi yoktur", () => {
    expect(sanitizeRichText('<p>Merhaba</p><script>alert(1)</script>')).toBe("<p>Merhaba</p>");
    expect(can("EDITOR", "products.write")).toBe(true);
    expect(can("EDITOR", "settings.write")).toBe(false);
    expect(can("ADMIN", "users.write")).toBe(true);
    expect(passwordIssues("kisa")).toContain("Parola en az 12 karakter olmalı.");
  });
});

describe("excel", () => {
  it("her satırı sütun bilgilerinden ürün olarak okur", async () => {
    const buffer = await buildProductSheet([
      {
        name: "40x40 Profil",
        sku: "KP-1",
        slug: "40x40-profil",
        categorySlug: "Kare profil",
        description: "Açıklama",
        profileType: "",
        sectionShape: "",
        widthMm: "40",
        heightMm: "",
        thicknessMm: "",
        lengthMm: "",
        materialGrade: "",
        weightPerMeter: "",
        unit: "METER",
        stockStatus: "IN_STOCK",
        minOrderQty: "6",
        featured: "false",
        published: "true",
        seoTitle: "",
        seoDescription: "",
      },
    ]);
    const rows = await parseProductSheet(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.line).toBe(2);
    expect(rows[0]?.row.name).toBe("40x40 Profil");
    expect(rows[0]?.row.categorySlug).toBe("Kare profil");
    expect(rows[0]?.row.unit).toBe("METER");
    expect(rows[0]?.row.published).toBe("true");
    expect(rows[0]?.row.widthMm).toBe("40");
  });

  it("eski xls dosyasını da okur", async () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Ürün adı", "Ürün kodu", "Kategori", "Birim", "Yayında", "En (mm)"],
      ["Lama 20", "LM-20", "Lama", "adet", "evet", 20],
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Ürünler");
    const xls = XLSX.write(book, { type: "buffer", bookType: "xls" }) as Buffer;
    const rows = await parseProductSheet(xls);
    expect(rows[0]?.row.name).toBe("Lama 20");
    expect(rows[0]?.row.sku).toBe("LM-20");
    expect(rows[0]?.row.unit).toBe("PIECE");
    expect(rows[0]?.row.published).toBe("true");
    expect(rows[0]?.row.widthMm).toBe("20");
  });
});
