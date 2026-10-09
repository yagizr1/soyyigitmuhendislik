import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";
import { addQuantities, normalizeQuantity, quantityAtLeast } from "@/lib/quantity";
import { buildQuoteMessage, buildWhatsAppUrl, normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { sanitizeRichText } from "@/lib/sanitize";
import { parseProductCsv } from "@/lib/csv";
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
    expect(normalizeWhatsAppNumber("05551112233")).toBeNull();
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

describe("csv", () => {
  it("ürün satırını okur", () => {
    const rows = parseProductCsv(
      "name,sku,slug,categorySlug,description,profileType,sectionShape,widthMm,heightMm,thicknessMm,lengthMm,materialGrade,weightPerMeter,unit,stockStatus,minOrderQty,featured,published,seoTitle,seoDescription\nA,K,a,kutu,aciklama,,,,,,,,,METER,IN_STOCK,6,false,false,,\n",
    );
    expect(rows[0]?.name).toBe("A");
    expect(rows[0]?.unit).toBe("METER");
  });
});
