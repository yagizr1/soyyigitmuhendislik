export const UNITS = ["PIECE", "METER", "KILOGRAM", "TON", "SQUARE_METER", "SET", "BOX"] as const;

export type Unit = (typeof UNITS)[number];

export const STOCK_STATUSES = [
  "IN_STOCK",
  "LOW_STOCK",
  "MADE_TO_ORDER",
  "OUT_OF_STOCK",
] as const;

export type StockStatus = (typeof STOCK_STATUSES)[number];

export const UNIT_LABELS: Record<Unit, string> = {
  PIECE: "adet",
  METER: "metre",
  KILOGRAM: "kilogram",
  TON: "ton",
  SQUARE_METER: "m²",
  SET: "takım",
  BOX: "koli",
};

export const STOCK_LABELS: Record<StockStatus, string> = {
  IN_STOCK: "Stokta",
  LOW_STOCK: "Sınırlı stok",
  MADE_TO_ORDER: "Sipariş üzerine üretim",
  OUT_OF_STOCK: "Stokta yok",
};

export const QUOTE_STATUS_LABELS = {
  NEW: "Yeni",
  REVIEWING: "İnceleniyor",
  QUOTED: "Teklif verildi",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
} as const;

export function isUnit(value: string): value is Unit {
  return (UNITS as readonly string[]).includes(value);
}

export function isStockStatus(value: string): value is StockStatus {
  return (STOCK_STATUSES as readonly string[]).includes(value);
}
