import { expect, test } from "@playwright/test";

test("ana sayfa, katalog filtresi, ürün ve teklif listesi", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("örnek", { exact: false }).first()).toBeVisible();

  await page.goto("/urunler?q=KP-40-40-2");
  await expect(page.getByRole("heading", { name: "40x40x2 mm Kare Profil" })).toBeVisible();

  await page.getByRole("link", { name: "40x40x2 mm Kare Profil" }).first().click();
  await expect(page).toHaveURL(/\/urun\/40x40x2-mm-kare-profil/);
  await expect(page.getByText("Fiyat teklif üzerine belirlenir")).toBeVisible();

  await page
    .getByRole("heading", { level: 1, name: "40x40x2 mm Kare Profil" })
    .locator("..")
    .getByRole("button", { name: "Teklife ekle" })
    .click();
  await page.getByRole("button", { name: "Listeye ekle" }).click();
  await page.goto("/teklif");
  await expect(page.getByText("KP-40-40-2")).toBeVisible();
  await expect(page.getByText("Fiyat teklif üzerine belirlenir")).toBeVisible();
  await expect(page.getByText("Mesajı siz göndermeden talep firmaya ulaşmış sayılmaz.")).toBeVisible();
});

test("sayfa 2 ve olmayan adres", async ({ page }) => {
  await page.goto("/urunler?sayfa=2");
  await expect(page.getByRole("navigation", { name: "Sayfalama" })).toBeVisible();
  const missing = await page.goto("/bu-sayfa-yok-404");
  expect(missing?.status()).toBe(404);
});

test("sitemap ve robots", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Disallow: /admin");
  expect(robotsText).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("/urunler");
  expect(xml).toContain("/urun/40x40x2-mm-kare-profil");
});

test("yetkisiz yönetici sayfası girişe gider", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/giris/);
  await expect(page.getByRole("heading", { name: "Yönetici girişi" })).toBeVisible();
});

test("mobil menü açılır", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  const menu = page.getByRole("navigation", { name: "Mobil menü" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: "İletişim" })).toBeVisible();
  await menu.getByText("Ürünler", { exact: true }).click();
  await expect(menu.getByRole("link", { name: "Tüm ürünler" })).toBeVisible();
});
