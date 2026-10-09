import { parse } from "csv-parse/sync";

export const PRODUCT_CSV_COLUMNS = [
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

export type ProductCsvRow = Record<(typeof PRODUCT_CSV_COLUMNS)[number], string>;

export function parseProductCsv(text: string): ProductCsvRow[] {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
    relax_column_count: false,
  }) as Record<string, string>[];

  return records.map((record) => {
    const row = {} as ProductCsvRow;
    for (const column of PRODUCT_CSV_COLUMNS) {
      row[column] = record[column] ?? "";
    }
    return row;
  });
}

function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => escapeCell(cell)).join(",")).join("\n");
}
