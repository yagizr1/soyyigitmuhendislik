"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveProduct } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fieldErrors, productSchema } from "@/lib/validators";
import { slugify } from "@/lib/slug";
import { STOCK_STATUSES, STOCK_LABELS, UNIT_LABELS, UNITS } from "@/lib/units";

type Values = {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  description: string;
  profileType: string;
  sectionShape: string;
  widthMm: string;
  heightMm: string;
  thicknessMm: string;
  lengthMm: string;
  materialGrade: string;
  weightPerMeter: string;
  unit: (typeof UNITS)[number];
  stockStatus: (typeof STOCK_STATUSES)[number];
  minOrderQty: string;
  unitPrice: string;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  specs: Record<string, string>;
};

export function ProductForm({
  id,
  values,
  categories,
  specFields,
}: {
  id: string | null;
  values: Values;
  categories: { id: string; name: string }[];
  specFields: { key: string; label: string; unit: string | null }[];
}) {
  const router = useRouter();
  const form = useForm<Values>({ defaultValues: values });
  const unit = form.watch("unit");

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(async (input) => {
        const prepared = {
          ...input,
          slug: input.slug.trim() || slugify(input.name),
          description: input.description.trim() || input.name.trim(),
          minOrderQty: input.minOrderQty.trim() || "1",
        };
        const parsed = productSchema.safeParse(prepared);
        if (!parsed.success) {
          const errors = fieldErrors(parsed.error);
          for (const [key, message] of Object.entries(errors)) {
            form.setError(key as keyof Values, { message });
          }
          toast.error("Formu kontrol edin.");
          return;
        }
        const result = await saveProduct(id, parsed.data);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Ürün kaydedildi.");
        router.push(`/admin/urunler/${result.data.id}`);
        router.refresh();
      })}
    >
      <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
        <h2 className="font-display text-2xl md:col-span-2">Ürün</h2>
        <Field label="Ürün adı" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field label="Ürün kodu" error={form.formState.errors.sku?.message}>
          <Input {...form.register("sku")} />
        </Field>
        <Field label="Kategori" error={form.formState.errors.categoryId?.message}>
          <select {...form.register("categoryId")} className="h-11 rounded-md border border-border bg-background px-3">
            <option value="">Seçin</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Satış birimi">
          <select {...form.register("unit")} className="h-11 rounded-md border border-border bg-background px-3">
            {UNITS.map((item) => (
              <option key={item} value={item}>{UNIT_LABELS[item]}</option>
            ))}
          </select>
        </Field>
        <Field label={`Birim fiyat (TL / ${UNIT_LABELS[unit]})`} error={form.formState.errors.unitPrice?.message}>
          <Input {...form.register("unitPrice")} inputMode="decimal" placeholder="Boş bırakılabilir" />
        </Field>
        <Field label="Minimum miktar" error={form.formState.errors.minOrderQty?.message}>
          <Input {...form.register("minOrderQty")} />
        </Field>
        <Field label="Stok durumu">
          <select {...form.register("stockStatus")} className="h-11 rounded-md border border-border bg-background px-3">
            {STOCK_STATUSES.map((status) => (
              <option key={status} value={status}>{STOCK_LABELS[status]}</option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end text-sm md:mb-2">
          <input type="checkbox" {...form.register("published")} /> Yayında
        </label>
      </section>
      <Field label="Açıklama" error={form.formState.errors.description?.message}>
        <Textarea {...form.register("description")} placeholder="Boşsa ürün adı yazılır" />
      </Field>
      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer font-semibold">Ölçü ve teknik bilgi</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Profil türü"><Input {...form.register("profileType")} /></Field>
          <Field label="Kesit"><Input {...form.register("sectionShape")} placeholder="kare, dikdortgen, kosebent, lama" /></Field>
          <Field label="En (mm)"><Input {...form.register("widthMm")} /></Field>
          <Field label="Boy (mm)"><Input {...form.register("heightMm")} /></Field>
          <Field label="Et kalınlığı (mm)"><Input {...form.register("thicknessMm")} /></Field>
          <Field label="Standart boy (mm)"><Input {...form.register("lengthMm")} /></Field>
          <Field label="Kalite sınıfı"><Input {...form.register("materialGrade")} /></Field>
          <Field label="kg/m"><Input {...form.register("weightPerMeter")} /></Field>
        </div>
      </details>
      {specFields.length > 0 ? (
        <fieldset className="grid gap-3 rounded-xl border border-border bg-card p-4">
          <legend className="px-1 font-semibold">Kategoriye özel alanlar</legend>
          {specFields.map((field) => (
            <label key={field.key} className="grid gap-1 text-sm">
              {field.label}{field.unit ? ` (${field.unit})` : ""}
              <Input {...form.register(`specs.${field.key}`)} />
            </label>
          ))}
        </fieldset>
      ) : null}
      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer font-semibold">Adres ve SEO</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Adres" error={form.formState.errors.slug?.message}>
            <Input {...form.register("slug")} placeholder="Boşsa addan üretilir" />
          </Field>
          <Field label="SEO başlığı"><Input {...form.register("seoTitle")} /></Field>
          <Field label="Meta açıklama"><Input {...form.register("seoDescription")} /></Field>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" {...form.register("featured")} /> Öne çıkar
          </label>
        </div>
      </details>
      <Button type="submit">{id ? "Kaydet" : "Ürünü kaydet"}</Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <Label>{label}</Label>
      {children}
      {error ? <span className="text-red-700">{error}</span> : null}
    </label>
  );
}
