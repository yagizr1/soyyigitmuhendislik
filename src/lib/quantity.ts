import type { Unit } from "@/lib/units";

export function decimalPlacesForUnit(unit: Unit): number {
  switch (unit) {
    case "PIECE":
    case "SET":
    case "BOX":
      return 0;
    case "METER":
    case "KILOGRAM":
    case "SQUARE_METER":
      return 2;
    case "TON":
      return 3;
    default: {
      const exhaustive: never = unit;
      return exhaustive;
    }
  }
}

export function normalizeQuantity(value: string, places: number): string | null {
  const trimmed = value.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;

  const [wholeRaw, fraction = ""] = trimmed.split(".");
  if (wholeRaw === undefined) return null;
  if (places === 0 && fraction.length > 0) return null;
  if (fraction.length > places) return null;

  const whole = String(Number(wholeRaw));
  if (!Number.isFinite(Number(whole))) return null;

  const normalized = fraction.length > 0 ? `${whole}.${fraction}` : whole;
  if (!(Number(normalized) > 0)) return null;
  return normalized;
}

export function quantityAtLeast(value: string, minimum: string): boolean {
  const left = Number(value);
  const right = Number(minimum);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return left + 1e-9 >= right;
}

export function addQuantities(a: string, b: string, places: number): string {
  const scale = 10 ** places;
  const sum = Math.round(Number(a) * scale) + Math.round(Number(b) * scale);
  const negativeSafe = Math.max(sum, 0);
  const text = (negativeSafe / scale).toFixed(places);
  return text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function formatQuantity(value: string, places: number): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: places,
  }).format(numeric);
}
