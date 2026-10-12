import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { slugify } from "@/lib/slug";
import { STOCK_LABELS, STOCK_STATUSES, UNIT_LABELS, UNITS, type StockStatus, type Unit } from "@/lib/units";

export const PRODUCT_SHEET_COLUMNS = [
  "name",
  "sku",
  "slug",
  "categorySlug",
  "description",
  "profileType",
  "sectionShape",
  "widthMm",
  "heightMm",
  "thicknessMm",
  "lengthMm",
  "materialGrade",
  "weightPerMeter",
  "unit",
  "stockStatus",
  "minOrderQty",
  "featured",
  "published",
  "seoTitle",
  "seoDescription",
] as const;

export type ProductSheetColumn = (typeof PRODUCT_SHEET_COLUMNS)[number];
export type ProductSheetRow = Record<ProductSheetColumn, string>;

export type ParsedProductRow = {
  line: number;
  row: ProductSheetRow;
};

const COLUMN_LABELS: Record<ProductSheetColumn, string> = {
  name: "Ürün adı",
  sku: "Ürün kodu",
  slug: "Adres",
  categorySlug: "Kategori",
  description: "Açıklama",
  profileType: "Profil türü",
  sectionShape: "Kesit",
  widthMm: "En (mm)",
  heightMm: "Boy (mm)",
  thicknessMm: "Et kalınlığı (mm)",
  lengthMm: "Standart boy (mm)",
  materialGrade: "Kalite sınıfı",
  weightPerMeter: "kg/m",
  unit: "Birim",
  stockStatus: "Stok durumu",
  minOrderQty: "Minimum miktar",
  featured: "Öne çıkar",
  published: "Yayında",
  seoTitle: "SEO başlığı",
  seoDescription: "Meta açıklama",
};

const EXTRA_HEADERS: Record<string, ProductSheetColumn> = {
  kod: "sku",
  "adres (slug)": "slug",
  categoryslug: "categorySlug",
  "kategori adresi": "categorySlug",
  en: "widthMm",
  boy: "heightMm",
  "et kalınlığı": "thicknessMm",
  "et kalinligi": "thicknessMm",
  "et kalinligi (mm)": "thicknessMm",
  "standart boy": "lengthMm",
  stok: "stockStatus",
  "min miktar": "minOrderQty",
  "one cikar": "featured",
};

export class ProductSheetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductSheetError";
  }
}

function headerKey(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

const HEADER_TO_COLUMN = new Map<string, ProductSheetColumn>();
for (const column of PRODUCT_SHEET_COLUMNS) {
  HEADER_TO_COLUMN.set(headerKey(column), column);
  HEADER_TO_COLUMN.set(headerKey(COLUMN_LABELS[column]), column);
}
for (const [header, column] of Object.entries(EXTRA_HEADERS)) {
  HEADER_TO_COLUMN.set(headerKey(header), column);
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return "";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.richText)) {
      return record.richText
        .map((part) => {
          if (part && typeof part === "object" && "text" in part) return String(part.text);
          return "";
        })
        .join("")
        .trim();
    }
    if ("result" in record) return cellText(record.result);
    if (typeof record.text === "string") return record.text.trim();
  }
  return "";
}

function emptyRow(): ProductSheetRow {
  return Object.fromEntries(PRODUCT_SHEET_COLUMNS.map((column) => [column, ""])) as ProductSheetRow;
}

function canonicalUnit(value: string): string {
  const key = headerKey(value);
  if (!key) return "";
  for (const unit of UNITS) {
    if (key === headerKey(unit) || key === headerKey(UNIT_LABELS[unit])) return unit;
  }
  if (key === "kg" || key === "kilo") return "KILOGRAM";
  if (key === "m²" || key === "m2") return "SQUARE_METER";
  if (key === "takım" || key === "takim") return "SET";
  if (key === "koli") return "BOX";
  return value.trim();
}

function canonicalStock(value: string): string {
  const key = headerKey(value);
  if (!key) return "IN_STOCK";
  for (const status of STOCK_STATUSES) {
    if (key === headerKey(status) || key === headerKey(STOCK_LABELS[status])) return status;
  }
  return value.trim();
}

function canonicalBool(value: string): string {
  const key = headerKey(value);
  if (key === "true" || key === "1" || key === "evet" || key === "yes" || key === "var") return "true";
  return "false";
}

function sheetMatrix(data: Uint8Array): string[][] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(Buffer.from(data), { type: "buffer", cellDates: false });
  } catch {
    throw new ProductSheetError("Excel dosyası okunamadı.");
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new ProductSheetError("Excel dosyasında sayfa yok.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true,
  });
  return rows.map((row) => (Array.isArray(row) ? row.map((cell) => cellText(cell)) : []));
}

export async function parseProductSheet(data: Uint8Array): Promise<ParsedProductRow[]> {
  const matrix = sheetMatrix(data);
  let headerRowNumber = 0;
  let columns = new Map<number, ProductSheetColumn>();
  matrix.forEach((cells, index) => {
    if (headerRowNumber) return;
    const found = new Map<number, ProductSheetColumn>();
    cells.forEach((text, colIndex) => {
      const column = HEADER_TO_COLUMN.get(headerKey(text));
      if (column) found.set(colIndex + 1, column);
    });
    if ([...found.values()].includes("name")) {
      headerRowNumber = index + 1;
      columns = found;
    }
  });

  if (!headerRowNumber) {
    throw new ProductSheetError("Başlık satırı bulunamadı. Bir satırda Ürün adı sütunu olmalı.");
  }

  const parsed: ParsedProductRow[] = [];
  matrix.forEach((cells, index) => {
    const line = index + 1;
    if (line <= headerRowNumber) return;
    const record = emptyRow();
    for (const [col, column] of columns) {
      record[column] = cells[col - 1] ?? "";
    }
    if (PRODUCT_SHEET_COLUMNS.every((column) => record[column] === "")) return;
    if (!record.name.trim() && !record.sku.trim()) return;
    record.unit = canonicalUnit(record.unit);
    record.stockStatus = canonicalStock(record.stockStatus);
    record.featured = canonicalBool(record.featured);
    record.published = canonicalBool(record.published);
    if (!record.slug.trim() && record.name.trim()) record.slug = slugify(record.name);
    if (!record.description.trim() && record.name.trim()) record.description = record.name.trim();
    if (!record.minOrderQty.trim()) record.minOrderQty = "1";
    parsed.push({ line, row: record });
  });

  return parsed;
}

function displayCell(column: ProductSheetColumn, value: string): string {
  if (column === "unit") {
    const unit = UNITS.find((item): item is Unit => item === value);
    return unit ? UNIT_LABELS[unit] : value;
  }
  if (column === "stockStatus") {
    const status = STOCK_STATUSES.find((item): item is StockStatus => item === value);
    return status ? STOCK_LABELS[status] : value;
  }
  if (column === "featured" || column === "published") {
    if (value === "true") return "evet";
    if (value === "false") return "hayır";
  }
  return value;
}

export async function buildProductSheet(rows: ProductSheetRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Ürünler");
  sheet.addRow(PRODUCT_SHEET_COLUMNS.map((column) => COLUMN_LABELS[column]));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  for (const row of rows) {
    sheet.addRow(PRODUCT_SHEET_COLUMNS.map((column) => displayCell(column, row[column])));
  }
  sheet.columns.forEach((column) => {
    column.width = 22;
  });
  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw);
}
