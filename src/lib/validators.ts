import { z } from "zod";
import { isReservedSlug, slugify } from "@/lib/slug";
import { STOCK_STATUSES, UNITS } from "@/lib/units";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

const required = (label: string) => z.string().trim().min(1, `${label} gerekli.`);

const optionalText = z.string().trim().optional().or(z.literal(""));

const optionalDecimal = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+([.,]\d+)?$/.test(value), "Sayı girin.")
  .transform((value) => value.replace(",", "."));

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Kullanıcı adı gerekli.")
    .max(64, "Kullanıcı adı çok uzun."),
  password: z.string().min(1, "Parola gerekli."),
});

export const productSchema = z.object({
  name: required("Ürün adı"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug gerekli.")
    .transform((value) => slugify(value))
    .refine((value) => value.length > 0, "Slug yalnızca harf ve rakam içermeli.")
    .refine((value) => !isReservedSlug(value), "Bu adres kullanılamaz."),
  sku: required("Ürün kodu").max(64, "Ürün kodu çok uzun."),
  categoryId: required("Kategori"),
  description: required("Açıklama"),
  profileType: z.string().trim().max(120).optional().or(z.literal("")),
  sectionShape: z.string().trim().max(80).optional().or(z.literal("")),
  widthMm: optionalDecimal,
  heightMm: optionalDecimal,
  thicknessMm: optionalDecimal,
  lengthMm: optionalDecimal,
  materialGrade: z.string().trim().max(80).optional().or(z.literal("")),
  weightPerMeter: optionalDecimal,
  unit: z.enum(UNITS),
  stockStatus: z.enum(STOCK_STATUSES),
  minOrderQty: z
    .string()
    .trim()
    .min(1, "Minimum sipariş miktarı gerekli.")
    .transform((value) => value.replace(",", "."))
    .refine((value) => /^\d+(\.\d+)?$/.test(value) && Number(value) > 0, "Geçerli bir miktar girin."),
  featured: z.boolean(),
  published: z.boolean(),
  seoTitle: z.string().trim().max(70, "SEO başlığı 70 karakteri aşmamalı.").optional().or(z.literal("")),
  seoDescription: z
    .string()
    .trim()
    .max(160, "Meta açıklama 160 karakteri aşmamalı.")
    .optional()
    .or(z.literal("")),
  specs: z.record(z.string(), z.string()).optional().default({}),
});

export const categorySchema = z.object({
  name: required("Kategori adı"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug gerekli.")
    .transform((value) => slugify(value))
    .refine((value) => value.length > 0, "Slug geçersiz.")
    .refine((value) => !isReservedSlug(value), "Bu adres kullanılamaz."),
  description: z.string().trim().optional().or(z.literal("")),
  parentId: z.string().trim().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  published: z.boolean(),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
  imageId: z.string().trim().optional().or(z.literal("")),
});

export const pageSchema = z.object({
  title: required("Başlık"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug gerekli.")
    .transform((value) => slugify(value))
    .refine((value) => value.length > 0 && !isReservedSlug(value), "Bu adres kullanılamaz."),
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  content: z.string().trim().min(1, "İçerik gerekli."),
  published: z.boolean(),
  showInNav: z.boolean(),
  showInFooter: z.boolean(),
  navLabel: z.string().trim().max(40).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160).optional().or(z.literal("")),
  canonicalPath: z
    .string()
    .trim()
    .refine((value) => value === "" || value.startsWith("/"), "Canonical yolu / ile başlamalı.")
    .optional()
    .or(z.literal("")),
  ogTitle: z.string().trim().max(70).optional().or(z.literal("")),
  robots: z.enum(["index,follow", "noindex,follow", "noindex,nofollow"]),
});

export const faqSchema = z.object({
  question: required("Soru").max(240),
  answer: required("Yanıt").max(4000),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  published: z.boolean(),
});

export const quoteItemSchema = z.object({
  productId: required("Ürün"),
  quantity: required("Miktar"),
});

export const quoteRequestSchema = z.object({
  companyName: required("Firma adı").max(160),
  contactName: optionalText,
  phone: optionalText,
  email: z.union([z.literal(""), z.string().trim().email("Geçerli bir e-posta girin.")]),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true, { message: "Kaydı oluşturmak için açık onay gerekli." }),
  items: z.array(quoteItemSchema).min(1, "Listede en az bir ürün olmalı."),
});

export const contactSchema = z.object({
  companyName: required("Firma veya ad").max(160),
  contactName: optionalText,
  phone: optionalText,
  email: z.union([z.literal(""), z.string().trim().email("Geçerli bir e-posta girin.")]),
  note: required("Mesaj").max(4000),
  consent: z.literal(true, { message: "İletiyi kaydetmek için açık onay gerekli." }),
});

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Renk #rrggbb biçiminde olmalı.");

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url("Geçerli bir bağlantı girin."),
]);

export const companySchema = z.object({
  name: required("Firma adı").max(120),
  legalName: z.string().trim().max(180).optional().or(z.literal("")),
  demo: z.boolean(),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.union([z.literal(""), z.string().trim().email("Geçerli bir e-posta girin.")]),
  whatsapp: z
    .string()
    .trim()
    .refine((value) => value === "" || normalizeWhatsAppNumber(value) !== null, {
      message: "WhatsApp numarası uluslararası biçimde olmalı. Örnek: +905551112233",
    })
    .transform((value) => (value === "" ? "" : (normalizeWhatsAppNumber(value) ?? ""))),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  mapUrl: optionalUrl,
  hours: z.string().trim().max(160).optional().or(z.literal("")),
  footerNote: z.string().trim().max(400).optional().or(z.literal("")),
});

export const socialSchema = z.object({
  linkedin: optionalUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  youtube: optionalUrl,
});

export const brandSchema = z.object({
  accent: hexColor,
  logoMediaId: z.string().trim().optional().or(z.literal("")),
  faviconMediaId: z.string().trim().optional().or(z.literal("")),
});

export const redirectSchema = z
  .object({
    fromPath: z
      .string()
      .trim()
      .min(1, "Kaynak yolu gerekli.")
      .refine((value) => value.startsWith("/") && !value.startsWith("//"), "Yol / ile başlamalı."),
    toPath: z
      .string()
      .trim()
      .min(1, "Hedef yolu gerekli.")
      .refine(
        (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
        "Hedef site içi yol veya http(s) adresi olmalı.",
      ),
    statusCode: z.union([z.literal(301), z.literal(302)]),
    active: z.boolean(),
  })
  .refine((value) => value.fromPath !== value.toPath, "Kaynak ve hedef aynı olamaz.");

export const seoSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .refine((value) => value.startsWith("/"), "Yol / ile başlamalı."),
  title: z.string().trim().max(70).optional().or(z.literal("")),
  description: z.string().trim().max(160).optional().or(z.literal("")),
  canonical: z
    .string()
    .trim()
    .refine((value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value), "Canonical geçersiz.")
    .optional()
    .or(z.literal("")),
  ogTitle: z.string().trim().max(70).optional().or(z.literal("")),
  robots: z.enum(["index,follow", "noindex,follow", "noindex,nofollow"]),
});

export const userCreateSchema = z.object({
  name: required("Ad").max(80),
  username: z
    .string()
    .trim()
    .min(2, "Kullanıcı adı en az 2 karakter olmalı.")
    .max(64, "Kullanıcı adı çok uzun.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Kullanıcı adı yalnızca harf, rakam, nokta, alt çizgi ve tire içerebilir."),
  email: z.string().trim().email("Geçerli bir e-posta girin."),
  password: z.string().min(1, "Parola gerekli."),
  role: z.enum(["ADMIN", "EDITOR"]),
});

export const homeLinkSchema = z.object({
  label: z.string().trim().min(1).max(40),
  href: z.string().trim().min(1).max(200),
});

export const homeSchema = z.object({
  hero: z.object({
    enabled: z.boolean(),
    eyebrow: z.string().trim().max(80),
    title: z.string().trim().min(1).max(140),
    subtitle: z.string().trim().max(400),
    imageMediaId: z.string().trim(),
    imageAlt: z.string().trim().max(180),
    primaryCta: homeLinkSchema,
    secondaryCta: homeLinkSchema,
  }),
  intro: z.object({
    enabled: z.boolean(),
    title: z.string().trim().max(120),
    body: z.string().trim().max(1200),
  }),
  featured: z.object({
    enabled: z.boolean(),
    title: z.string().trim().max(120),
    subtitle: z.string().trim().max(240),
  }),
  stats: z.object({
    enabled: z.boolean(),
    title: z.string().trim().max(120),
    items: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(60),
          value: z.string().trim().min(1).max(40),
        }),
      )
      .max(6),
  }),
  faq: z.object({
    enabled: z.boolean(),
    title: z.string().trim().max(120),
    subtitle: z.string().trim().max(240),
  }),
  contact: z.object({
    enabled: z.boolean(),
    title: z.string().trim().max(120),
    subtitle: z.string().trim().max(240),
  }),
  cta: z.object({
    enabled: z.boolean(),
    title: z.string().trim().max(140),
    body: z.string().trim().max(400),
  }),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type PageInput = z.infer<typeof pageSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type HomeInput = z.infer<typeof homeSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
