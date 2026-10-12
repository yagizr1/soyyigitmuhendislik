import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient, type Unit, type StockStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();
const catalogPath = path.join(process.cwd(), "data", "stok-katalog.json");

const categories = [
  { name: "Profil", slug: "profil", sortOrder: 1 },
  { name: "Ferforje", slug: "ferforje", sortOrder: 2 },
  { name: "Boya", slug: "boya", sortOrder: 3 },
  { name: "Menteşe", slug: "mentese", sortOrder: 4 },
  { name: "Kilit ve sürgü", slug: "kilit-ve-surgu", sortOrder: 5 },
  { name: "Rulman, mil ve makara", slug: "rulman-mil-makara", sortOrder: 6 },
  { name: "Vida ve bağlantı", slug: "vida-ve-baglanti", sortOrder: 7 },
  { name: "Sac, levha ve panel", slug: "sac-levha-panel", sortOrder: 8 },
  { name: "El aleti", slug: "el-aleti", sortOrder: 9 },
  { name: "İş güvenliği", slug: "is-guvenligi", sortOrder: 10 },
  { name: "Hırdavat", slug: "hirdavat", sortOrder: 11 },
] as const;

type CategoryName = (typeof categories)[number]["name"];

const rules: { name: CategoryName; pattern: RegExp }[] = [
  { name: "Boya", pattern: /boya|astar|tiner|antipas|sonkat|son kat|sprey|rapid|rapit|vernik|selulozik|shopprimer|binder|grandex/ },
  { name: "Ferforje", pattern: /ferforje|ferfroje|mizrak|halka/ },
  { name: "Menteşe", pattern: /mentese/ },
  { name: "Kilit ve sürgü", pattern: /kilit|surgu/ },
  { name: "Rulman, mil ve makara", pattern: /rulman|(^|[^a-z])mil([^a-z]|$)|makara|bilya/ },
  { name: "Vida ve bağlantı", pattern: /vida|civata|somun|dubel|civi|saplama|gergi|gijon/ },
  { name: "Sac, levha ve panel", pattern: /sac|levha|(^|[^a-z])rulo([^a-z]|$)|sandvic panel|polikarbon|izocam|camyunu|panel|plaka/ },
  { name: "Profil", pattern: /profil|(^|[^a-z])lama([^a-z]|$)|kosebent|cubuk/ },
  { name: "El aleti", pattern: /matkap|izeltas|karbosan|taslama|zimpara|kesici tas|elektrod|silikon/ },
  { name: "İş güvenliği", pattern: /ayakkabi|eldiven|baret/ },
];

const demoSkus = [
  "KP-40-40-2",
  "KP-50-50-2",
  "KP-60-60-3",
  "KP-80-80-3",
  "DP-40-20-2",
  "DP-60-40-2",
  "DP-80-40-3",
  "DP-100-50-3",
  "DP-120-60-4",
  "KB-30-30-3",
  "KB-40-40-4",
  "KB-50-50-5",
  "LM-20-3",
  "LM-50-5",
  "PL-100-100-8",
  "LM-KESIM-KG",
];

type CatalogProduct = {
  name: string;
  sku: string;
  slug: string;
  category: CategoryName;
  unit: Unit;
  stock: StockStatus;
  brand: string;
};

type CatalogFile = {
  categories: { name: string; slug: string; sortOrder: number }[];
  products: CatalogProduct[];
};

function fold(value: string): string {
  const letters: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return Array.from(value.toLocaleLowerCase("tr-TR").replaceAll("ı", "i"))
    .map((char) => letters[char] ?? char)
    .join("");
}

function classify(name: string, group: string): CategoryName {
  const text = fold(name);
  for (const rule of rules) {
    if (rule.pattern.test(text)) return rule.name;
  }
  if (group === "BOYA") return "Boya";
  if (group === "PROFİL") return "Profil";
  return "Hırdavat";
}

function isInternalRow(name: string): boolean {
  const text = fold(name);
  return /yemek bedeli|maden suyu|mad\.suyu|gazli icecek|sut aromali|(^|[^a-z])kek([^a-z]|$)|cikolata|biskuvi|ekmeg|tursu|sirke|islak havlu|el kremi|asperox|nugali|sleepy/.test(text);
}

function mapUnit(value: string): Unit {
  const key = value.trim().toLocaleLowerCase("tr-TR");
  if (key === "kg") return "KILOGRAM";
  if (key === "metre") return "METER";
  if (key === "m²" || key === "m2") return "SQUARE_METER";
  if (key === "takım") return "SET";
  if (key === "koli") return "BOX";
  return "PIECE";
}

function mapStock(value: string): StockStatus {
  const normalized = value.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  if (Number.isFinite(amount) && amount > 0) return "IN_STOCK";
  return "OUT_OF_STOCK";
}

function cleanBrand(value: string): string {
  const brand = value.trim();
  if (!brand) return "";
  if (/^[\d.,]+$/.test(brand)) return "";
  return brand;
}

function buildCatalog(filePath: string): { catalog: CatalogFile; skipped: string[] } {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!sheet) throw new Error("Excel sayfası yok.");
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, raw: false, defval: "" });
  const skipped: string[] = [];
  const usedSlugs = new Set<string>();
  const products: CatalogProduct[] = [];

  for (const row of rows.slice(1)) {
    const sku = String(row[1] ?? "").trim();
    const name = String(row[2] ?? "").trim().replace(/\s+/g, " ");
    if (!sku || !name) continue;
    if (isInternalRow(name)) {
      skipped.push(`${sku} ${name}`);
      continue;
    }
    let slug = slugify(name).slice(0, 70) || slugify(sku);
    if (!slug || usedSlugs.has(slug)) slug = `${slugify(name).slice(0, 50) || "urun"}-${slugify(sku)}`.slice(0, 80);
    usedSlugs.add(slug);
    products.push({
      name,
      sku: sku.slice(0, 64),
      slug,
      category: classify(name, String(row[12] ?? "").trim()),
      unit: mapUnit(String(row[7] ?? "")),
      stock: mapStock(String(row[5] ?? "")),
      brand: cleanBrand(String(row[13] ?? "")),
    });
  }

  return { catalog: { categories: [...categories], products }, skipped };
}

async function importCatalog(catalog: CatalogFile) {
  const categoryIds = new Map<string, string>();
  for (const category of catalog.categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        published: true,
        sortOrder: category.sortOrder,
        description: `${category.name} ürünleri.`,
      },
      create: {
        name: category.name,
        slug: category.slug,
        published: true,
        sortOrder: category.sortOrder,
        description: `${category.name} ürünleri.`,
      },
    });
    categoryIds.set(category.name, saved.id);
  }

  const removed = await prisma.product.deleteMany({ where: { sku: { in: demoSkus } } });
  let written = 0;
  for (const product of catalog.products) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Kategori yok: ${product.category}`);
    const description = product.brand ? `${product.name}. Marka: ${product.brand}.` : product.name;
    const data = {
      name: product.name,
      slug: product.slug,
      categoryId,
      description,
      unit: product.unit,
      stockStatus: product.stock,
      minOrderQty: "1",
      published: true,
      featured: false,
    };
    const existing = await prisma.product.findUnique({ where: { sku: product.sku }, select: { id: true } });
    if (existing) {
      await prisma.product.update({ where: { sku: product.sku }, data });
    } else {
      const slugTaken = await prisma.product.findUnique({ where: { slug: product.slug }, select: { id: true } });
      await prisma.product.create({
        data: { ...data, sku: product.sku, slug: slugTaken ? `${product.slug}-${slugify(product.sku)}`.slice(0, 80) : product.slug },
      });
    }
    written += 1;
  }

  const emptyCategories = await prisma.category.findMany({
    where: { products: { none: {} } },
    select: { id: true },
  });
  if (emptyCategories.length > 0) {
    await prisma.category.updateMany({
      where: { id: { in: emptyCategories.map((category) => category.id) } },
      data: { published: false },
    });
  }
  console.log(`yazildi ${written}, ornek silindi ${removed.count}, bos kategori gizlendi ${emptyCategories.length}`);
}

async function main() {
  const source = process.argv[2];
  let catalog: CatalogFile;
  if (source && (source.toLowerCase().endsWith(".xls") || source.toLowerCase().endsWith(".xlsx"))) {
    const built = buildCatalog(source);
    mkdirSync(path.dirname(catalogPath), { recursive: true });
    writeFileSync(catalogPath, JSON.stringify(built.catalog, null, 2));
    console.log(`katalog ${built.catalog.products.length}, atlanan ${built.skipped.length}`);
    console.log(built.skipped.join("\n"));
    const counts = new Map<string, number>();
    for (const product of built.catalog.products) counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    console.log([...counts.entries()].map(([name, count]) => `${count} ${name}`).join("\n"));
    catalog = built.catalog;
  } else {
    catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as CatalogFile;
  }
  if (process.argv.includes("--dry")) return;
  await importCatalog(catalog);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
