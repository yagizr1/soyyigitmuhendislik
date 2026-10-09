"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuote, type QuoteLine } from "@/components/quote/quote-provider";
import { decimalPlacesForUnit, formatQuantity, normalizeQuantity, quantityAtLeast } from "@/lib/quantity";
import { UNIT_LABELS, type Unit } from "@/lib/units";

export function AddToQuote({
  product,
}: {
  product: Omit<QuoteLine, "quantity" | "unitLabel"> & { unit: Unit; minOrderQty: string };
}) {
  const { addItem } = useQuote();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(product.minOrderQty);
  const places = decimalPlacesForUnit(product.unit);
  const unitLabel = UNIT_LABELS[product.unit];

  function submit() {
    const normalized = normalizeQuantity(quantity, places);
    if (!normalized) {
      toast.error(
        places === 0
          ? "Adet için tam sayı girin."
          : `En fazla ${places} ondalık basamak kullanın. Virgül yerine nokta da yazabilirsiniz.`,
      );
      return;
    }
    if (!quantityAtLeast(normalized, product.minOrderQty)) {
      toast.error(`Minimum miktar ${formatQuantity(product.minOrderQty, places)} ${unitLabel}.`);
      return;
    }
    addItem({ ...product, quantity: normalized, unitLabel });
    toast.success("Ürün sepete eklendi.");
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button type="button" variant="accent" className="w-full">
          <ShoppingCart aria-hidden="true" />
          Sepete ekle
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-steel/70" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card p-5 shadow-xl">
          <Dialog.Title className="font-display text-2xl">{product.name}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            Kod {product.sku}. Birim: {unitLabel}. Minimum {formatQuantity(product.minOrderQty, places)}{" "}
            {unitLabel}. Aynı ürün yeniden eklenirse miktarlar toplanır; birimler dönüştürülmez.
          </Dialog.Description>
          <div className="mt-4">
            <Label htmlFor={`qty-${product.productId}`}>Miktar ({unitLabel})</Label>
            <Input
              id={`qty-${product.productId}`}
              className="mt-1"
              inputMode={places === 0 ? "numeric" : "decimal"}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" variant="accent" onClick={submit}>
              <ShoppingCart aria-hidden="true" />
              Sepete ekle
            </Button>
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                Vazgeç
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
