"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { Unit } from "@/lib/units";
import { addQuantities, decimalPlacesForUnit } from "@/lib/quantity";

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  unit: Unit;
  unitLabel: string;
  minOrderQty: string;
  quantity: string;
  imageUrl: string | null;
  imageAlt: string;
};

type QuoteContextValue = {
  ready: boolean;
  items: QuoteLine[];
  addItem: (item: QuoteLine) => void;
  setQuantity: (productId: string, quantity: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);
const STORAGE_KEY = "soyyigit-quote-v1";
const CHANGE_EVENT = "soyyigit-quote-change";
const EMPTY: QuoteLine[] = [];

let cachedRaw: string | null = null;
let cachedItems: QuoteLine[] = EMPTY;

function isLine(value: unknown): value is QuoteLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<QuoteLine>;
  return Boolean(line.productId && line.slug && line.name && line.sku && line.unit && line.quantity);
}

function readItems(): QuoteLine[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cachedItems = Array.isArray(parsed) ? parsed.filter(isLine) : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function writeItems(items: QuoteLine[]) {
  const raw = JSON.stringify(items);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedItems = items;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readItems, () => EMPTY);

  const value = useMemo<QuoteContextValue>(
    () => ({
      ready: true,
      items,
      addItem(item) {
        const current = readItems();
        const existing = current.find((line) => line.productId === item.productId);
        if (!existing) {
          writeItems([...current, item]);
          return;
        }
        writeItems(
          current.map((line) =>
            line.productId === item.productId
              ? {
                  ...line,
                  quantity: addQuantities(line.quantity, item.quantity, decimalPlacesForUnit(line.unit)),
                }
              : line,
          ),
        );
      },
      setQuantity(productId, quantity) {
        writeItems(readItems().map((line) => (line.productId === productId ? { ...line, quantity } : line)));
      },
      removeItem(productId) {
        writeItems(readItems().filter((line) => line.productId !== productId));
      },
      clear() {
        writeItems([]);
      },
    }),
    [items],
  );

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote() {
  const value = useContext(QuoteContext);
  if (!value) throw new Error("Teklif listesi kullanılamıyor.");
  return value;
}
