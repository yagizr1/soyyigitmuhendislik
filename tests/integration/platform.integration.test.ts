import { afterAll, beforeAll, expect, test } from "vitest";
import { PrismaClient } from "@prisma/client";
import { queryProducts } from "@/lib/catalog";
import { can } from "@/lib/permissions";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sanitizeRichText } from "@/lib/sanitize";
import { signSession, readSessionToken } from "@/lib/session-token";
import { buildQuoteMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { productSchema, quoteRequestSchema } from "@/lib/validators";

process.env.AUTH_SECRET ??= "integration-test-secret-value-32chars";

const prisma = new PrismaClient();
const prefix = `it-${Date.now()}`;

beforeAll(async () => {
  await prisma.$queryRaw`SELECT 1`;
});

afterAll(async () => {
  await prisma.quoteRequestItem.deleteMany({ where: { sku: { startsWith: prefix } } });
  await prisma.product.deleteMany({ where: { sku: { startsWith: prefix } } });
  await prisma.page.deleteMany({ where: { slug: { startsWith: prefix } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: prefix } } });
  await prisma.$disconnect();
});

test("ürün oluşturma, filtre, sayfalama ve düzenleme", async () => {
  const category = await prisma.category.create({
    data: { name: "Test kategori", slug: `${prefix}-kat`, published: true },
  });
  const created = [];
  for (let index = 0; index < 13; index += 1) {
    created.push(
      await prisma.product.create({
        data: {
          name: index === 0 ? "Filtre profili" : `Test urun ${index}`,
          slug: `${prefix}-urun-${index}`,
          sku: `${prefix}-${index}`,
          categoryId: category.id,
          description: "Entegrasyon kaydı",
          profileType: index === 0 ? "Test profil" : "Diger",
          widthMm: index === 0 ? "40" : "80",
          unit: "METER",
          minOrderQty: "6",
          published: true,
          specs: { surface: index === 0 ? "Siyah" : "Galvaniz" },
        },
      }),
    );
  }

  await prisma.product.create({
    data: {
      name: "Gizli urun",
      slug: `${prefix}-gizli`,
      sku: `${prefix}-gizli`,
      categoryId: category.id,
      description: "Taslak",
      unit: "METER",
      minOrderQty: "6",
      published: false,
    },
  });

  const listed = await queryProducts({ sayfa: "2" });
  expect(listed.page).toBe(2);
  expect(listed.pageCount).toBeGreaterThan(1);

  const filtered = await queryProducts({ q: `${prefix}-0`, profil: "Test profil", enMax: "50", yuzey: "Siyah" });
  expect(filtered.items.map((item) => item.sku)).toEqual([`${prefix}-0`]);

  const hidden = await queryProducts({ q: `${prefix}-gizli` });
  expect(hidden.total).toBe(0);

  await prisma.product.update({
    where: { id: created[0].id },
    data: { name: "Filtre profili guncel", published: true },
  });
  const updated = await queryProducts({ q: `${prefix}-0` });
  expect(updated.items[0]?.name).toBe("Filtre profili guncel");
});

test("geçersiz ürün ve onaysız teklif reddedilir", () => {
  const product = productSchema.safeParse({
    name: "",
    slug: "urun",
    sku: "",
    categoryId: "",
    description: "",
    unit: "METER",
    stockStatus: "IN_STOCK",
    minOrderQty: "0",
    featured: false,
    published: false,
  });
  expect(product.success).toBe(false);

  const quote = quoteRequestSchema.safeParse({
    companyName: "Deneme",
    consent: false,
    items: [{ productId: "x", quantity: "1" }],
  });
  expect(quote.success).toBe(false);
});

test("sayfa içeriği kaydedilip yeniden okunur", async () => {
  const html = sanitizeRichText("<p>Merhaba</p><script>alert(1)</script>");
  const page = await prisma.page.create({
    data: {
      slug: `${prefix}-sayfa`,
      title: "Test sayfa",
      content: html,
      published: true,
    },
  });
  const loaded = await prisma.page.findUnique({ where: { id: page.id } });
  expect(loaded?.content).toBe("<p>Merhaba</p>");
});

test("teklif talebi ürün ve miktarla kaydolur", async () => {
  const category = await prisma.category.findFirstOrThrow({ where: { slug: `${prefix}-kat` } });
  const product = await prisma.product.findFirstOrThrow({ where: { sku: `${prefix}-0` } });
  const parsed = quoteRequestSchema.parse({
    companyName: "Örnek Alıcı",
    email: "",
    note: "Teslim tarihi sorunuz",
    consent: true,
    items: [{ productId: product.id, quantity: "6" }],
  });
  const quote = await prisma.quoteRequest.create({
    data: {
      source: "CART",
      companyName: parsed.companyName,
      note: parsed.note,
      consent: true,
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: parsed.items[0].quantity,
            unit: product.unit,
          },
        ],
      },
    },
    include: { items: true },
  });
  const stored = await prisma.quoteRequest.findUnique({ where: { id: quote.id }, include: { items: true } });
  expect(stored?.items[0]?.sku).toBe(product.sku);
  expect(stored?.items[0]?.quantity.toString()).toBe("6");
  expect(stored?.status).toBe("NEW");
  expect(category.id).toBeTruthy();

  const message = buildQuoteMessage({
    companyName: stored!.companyName,
    note: stored!.note ?? "",
    items: stored!.items.map((item) => ({
      name: item.productName,
      sku: item.sku,
      quantity: item.quantity.toString(),
      unitLabel: "metre",
    })),
  });
  const url = buildWhatsAppUrl("+905551112233", message);
  expect(url).toContain("https://wa.me/905551112233?text=");
  expect(decodeURIComponent(url!.split("text=")[1])).toContain(product.sku);
  expect(message).not.toMatch(/TL|₺/);
});

test("yönetici oturumu ve editör yetkisi", async () => {
  const password = "Integration-Test-1";
  const user = await prisma.user.create({
    data: {
      username: prefix.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 64) || "test-user",
      email: `${prefix}@example.com`,
      name: "Test",
      passwordHash: await hashPassword(password),
      role: "EDITOR",
      active: true,
    },
  });
  expect(await verifyPassword(password, user.passwordHash)).toBe(true);
  expect(await verifyPassword("yanlis-parola", user.passwordHash)).toBe(false);
  expect(can("EDITOR", "products.write")).toBe(true);
  expect(can("EDITOR", "settings.write")).toBe(false);
  expect(can("ADMIN", "users.write")).toBe(true);

  const token = await signSession({ id: user.id, email: user.email, name: user.name, role: "EDITOR" });
  const session = await readSessionToken(token);
  expect(session?.role).toBe("EDITOR");
  expect(await readSessionToken(`${token}x`)).toBeNull();
});
