"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuote } from "@/components/quote/quote-provider";
import { SafeImage } from "@/components/site/safe-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addQuantities, decimalPlacesForUnit, formatQuantity, normalizeQuantity, quantityAtLeast } from "@/lib/quantity";
import { buildQuoteMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

function stepDown(current: string, places: number, minimum: string): string {
  const base = normalizeQuantity(current, places) ?? minimum;
  const scale = 10 ** places;
  const next = Math.round(Number(base) * scale) - scale;
  const min = Math.round(Number(minimum) * scale);
  if (next < min) return minimum;
  return (next / scale).toFixed(places).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function QuoteCart({ whatsappNumber }: { whatsappNumber: string }) {
  const { ready, items, setQuantity, removeItem } = useQuote();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  if (!ready) return <p>Teklif listesi yükleniyor.</p>;
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p>Listeniz boş. Katalogdan ürün ekleyebilirsiniz.</p>
        <Link href="/urunler" className="mt-4 inline-flex h-11 items-center rounded-md bg-steel px-4 font-semibold text-white">
          Ürünlere git
        </Link>
      </div>
    );
  }

  const message = buildQuoteMessage({
    companyName,
    contactName,
    phone,
    email,
    note,
    items: items.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: formatQuantity(item.quantity, decimalPlacesForUnit(item.unit)),
      unitLabel: item.unitLabel,
    })),
  });
  const whatsappUrl = whatsappNumber ? buildWhatsAppUrl(whatsappNumber, message) : null;

  function sendWhatsApp() {
    if (!companyName.trim() || !phone.trim() || !note.trim()) {
      toast.error("Firma adı, telefon ve not zorunludur.");
      return;
    }
    if (!whatsappUrl) {
      toast.error("WhatsApp numarası henüz tanımlanmadı.");
      return;
    }
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-4">
        <p className="text-sm text-muted">{items.length} ürün çeşidi. Fiyat teklif üzerine belirlenir.</p>
        {items.map((item) => {
          const places = decimalPlacesForUnit(item.unit);
          const shortUnit = item.unit === "METER" ? "m" : item.unit === "KILOGRAM" ? "kg" : item.unit === "TON" ? "t" : "adet";
          return (
            <article key={item.productId} className="relative grid grid-cols-[88px_1fr] gap-3 rounded-lg border border-border bg-card p-3 pr-12">
              <button
                type="button"
                className="absolute top-2 right-2 inline-flex size-9 items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-50 hover:text-red-700"
                aria-label="Listeden çıkar"
                onClick={() => removeItem(item.productId)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
              <div className="relative h-20 overflow-hidden rounded-md bg-zinc-100">
                <SafeImage src={item.imageUrl || "/photos/kutu.jpg"} alt={item.imageAlt || item.name} sizes="88px" />
              </div>
              <div>
                <h2 className="font-display text-xl leading-tight">
                  <Link href={`/urun/${item.slug}`}>{item.name}</Link>
                </h2>
                <p className="text-sm text-muted">Kod: {item.sku}</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor={`qty-${item.productId}`} className="text-sm">
                      Miktar · {shortUnit}
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded-md border border-border text-lg leading-none"
                        aria-label="Miktarı azalt"
                        onClick={() => {
                          const current = normalizeQuantity(item.quantity, places) ?? item.minOrderQty;
                          const next = stepDown(current, places, item.minOrderQty);
                          if (next === current) {
                            toast.error(`Minimum ${formatQuantity(item.minOrderQty, places)} ${item.unitLabel}.`);
                          }
                          setQuantity(item.productId, next);
                        }}
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded-md border border-border text-lg leading-none"
                        aria-label="Miktarı artır"
                        onClick={() => {
                          const base = normalizeQuantity(item.quantity, places) ?? item.minOrderQty;
                          setQuantity(item.productId, addQuantities(base, "1", places));
                        }}
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <input
                    id={`qty-${item.productId}`}
                    className="mt-1 h-11 w-full rounded-md border border-border px-3"
                    value={item.quantity}
                    inputMode={places === 0 ? "numeric" : "decimal"}
                    onChange={(event) => {
                      const next = normalizeQuantity(event.target.value, places);
                      if (!next) {
                        setQuantity(item.productId, event.target.value);
                        return;
                      }
                      setQuantity(item.productId, next);
                    }}
                    onBlur={() => {
                      const next = normalizeQuantity(item.quantity, places);
                      if (!next || !quantityAtLeast(next, item.minOrderQty)) {
                        toast.error(`Minimum ${formatQuantity(item.minOrderQty, places)} ${item.unitLabel}.`);
                        setQuantity(item.productId, item.minOrderQty);
                      }
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <form
        className="h-fit space-y-3 rounded-lg border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          sendWhatsApp();
        }}
      >
        <h2 className="font-display text-2xl">Talep bilgisi</h2>
        <div>
          <Label htmlFor="companyName">Firma adı</Label>
          <Input id="companyName" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="contactName">İlgili kişi</Label>
          <Input id="contactName" value={contactName} onChange={(event) => setContactName(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="note">Not</Label>
          <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} required />
        </div>
        <p className="text-sm leading-6 text-muted">
          Düğme, doldurduğunuz bilgilerle hazırlanmış bir WhatsApp taslağı açar. Mesajı siz gönderince kayıtlı numaraya ulaşır.
        </p>
        {whatsappNumber ? null : (
          <p className="rounded-md bg-zinc-100 p-3 text-sm">WhatsApp numarası henüz tanımlanmadı. Yönetici panelinden eklenebilir.</p>
        )}
        <button
          type="submit"
          disabled={!whatsappNumber}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#128C7E] font-semibold text-white disabled:opacity-50"
        >
          WhatsApp gönder
        </button>
      </form>
    </div>
  );
}
