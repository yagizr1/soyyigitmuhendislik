"use client";

import { useMemo, useState } from "react";
import { formatTry, lineTotal } from "@/lib/money";
import { decimalPlacesForUnit, formatQuantity, normalizeQuantity, quantityAtLeast } from "@/lib/quantity";
import { UNIT_LABELS, type Unit } from "@/lib/units";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function PriceCalculator({
  name,
  sku,
  unit,
  unitPrice,
  minOrderQty,
  whatsapp,
}: {
  name: string;
  sku: string;
  unit: Unit;
  unitPrice: string | null;
  minOrderQty: string;
  whatsapp: string;
}) {
  const places = decimalPlacesForUnit(unit);
  const unitLabel = UNIT_LABELS[unit];
  const [quantity, setQuantity] = useState(minOrderQty);
  const normalized = normalizeQuantity(quantity, places);
  const total = unitPrice && normalized ? lineTotal(unitPrice, normalized) : null;
  const belowMinimum = Boolean(normalized && !quantityAtLeast(normalized, minOrderQty));

  const href = useMemo(() => {
    if (!whatsapp) return null;
    const amount = normalized && !belowMinimum ? normalized : formatQuantity(minOrderQty, places);
    const sum = unitPrice ? lineTotal(unitPrice, amount) : null;
    const lines = [
      "Merhaba,",
      "",
      `${name} (kod: ${sku}) için iletişime geçmek istiyorum.`,
      `Miktar: ${amount} ${unitLabel}`,
    ];
    if (unitPrice && sum != null) {
      lines.push(`Birim fiyat: ${formatTry(Number(unitPrice))} / ${unitLabel}`, `Toplam: ${formatTry(sum)}`);
    }
    lines.push("", "Bu mesaj taslaktır; gönderilmeden firmaya ulaşmış sayılmaz.");
    return buildWhatsAppUrl(whatsapp, lines.join("\n"));
  }, [whatsapp, normalized, belowMinimum, minOrderQty, places, unitPrice, name, sku, unitLabel]);

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      {unitPrice ? (
        <p className="text-sm text-muted">
          Birim fiyat <span className="font-semibold text-foreground">{formatTry(Number(unitPrice))}</span> / {unitLabel}
        </p>
      ) : (
        <p className="text-sm text-muted">Bu ürünün birim fiyatı girilmedi. Miktarı yazıp WhatsApp’tan sorun.</p>
      )}
      <label className="mt-3 grid gap-1 text-sm">
        Miktar ({unitLabel})
        <input
          value={quantity}
          inputMode="decimal"
          onChange={(event) => setQuantity(event.target.value)}
          className="h-11 rounded-md border border-border bg-background px-3"
        />
      </label>
      {belowMinimum ? (
        <p className="mt-2 text-sm text-red-700">
          Minimum miktar {formatQuantity(minOrderQty, places)} {unitLabel}.
        </p>
      ) : null}
      {unitPrice && total != null && !belowMinimum ? (
        <p className="mt-3 font-display text-3xl">{formatTry(total)}</p>
      ) : null}
      {href && !belowMinimum ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#128C7E] px-4 font-semibold text-white transition hover:brightness-110"
        >
          WhatsApp’tan iletişime geç
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-md bg-[#128C7E] px-4 font-semibold text-white opacity-60"
        >
          WhatsApp’tan iletişime geç
        </button>
      )}
    </div>
  );
}
