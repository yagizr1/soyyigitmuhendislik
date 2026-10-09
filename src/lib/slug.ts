const TURKISH_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  i: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function slugify(input: string): string {
  const mapped = Array.from(input)
    .map((char) => TURKISH_MAP[char] ?? char)
    .join("");

  return mapped
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "urun",
  "urunler",
  "kategori",
  "teklif",
  "uploads",
  "media",
  "sitemap",
  "robots",
  "favicon",
  "icon",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
