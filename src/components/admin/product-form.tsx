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

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(async (input) => {
        const parsed = productSchema.safeParse(input);
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
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Ürün adı" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field label="Adres (slug)" error={form.formState.errors.slug?.message}>
          <Input {...form.register("slug")} />
        </Field>
        <Field label="Ürün kodu" error={form.formState.errors.sku?.message}>
          <Input {...form.register("sku")} />
        </Field>
        <Field label="Kategori" error={form.formState.errors.categoryId?.message}>
          <select {...form.register("categoryId")} className="h-11 rounded-md border border-border px-3">
            <option value="">Seçin</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Profil türü">
          <Input {...form.register("profileType")} />
        </Field>
        <Field label="Kesit">
          <Input {...form.register("sectionShape")} placeholder="kare, dikdortgen, kosebent, lama" />
        </Field>
        <Field label="En (mm)"><Input {...form.register("widthMm")} /></Field>
        <Field label="Boy (mm)"><Input {...form.register("heightMm")} /></Field>
        <Field label="Et kalınlığı (mm)"><Input {...form.register("thicknessMm")} /></Field>
        <Field label="Standart boy (mm)"><Input {...form.register("lengthMm")} /></Field>
        <Field label="Kalite sınıfı"><Input {...form.register("materialGrade")} /></Field>
        <Field label="kg/m"><Input {...form.register("weightPerMeter")} /></Field>
        <Field label="Birim">
          <select {...form.register("unit")} className="h-11 rounded-md border border-border px-3">
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>
            ))}
          </select>
        </Field>
        <Field label="Stok durumu">
          <select {...form.register("stockStatus")} className="h-11 rounded-md border border-border px-3">
            {STOCK_STATUSES.map((status) => (
              <option key={status} value={status}>{STOCK_LABELS[status]}</option>
            ))}
          </select>
        </Field>
        <Field label="Minimum miktar" error={form.formState.errors.minOrderQty?.message}>
          <Input {...form.register("minOrderQty")} />
        </Field>
      </div>
      <Field label="Açıklama" error={form.formState.errors.description?.message}>
        <Textarea {...form.register("description")} />
      </Field>
      {specFields.length > 0 ? (
        <fieldset className="grid gap-3">
          <legend className="font-semibold">Kategoriye özel alanlar</legend>
          {specFields.map((field) => (
            <label key={field.key} className="grid gap-1 text-sm">
              {field.label}{field.unit ? ` (${field.unit})` : ""}
              <Input {...form.register(`specs.${field.key}`)} />
            </label>
          ))}
        </fieldset>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="SEO başlığı"><Input {...form.register("seoTitle")} /></Field>
        <Field label="Meta açıklama"><Input {...form.register("seoDescription")} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("featured")} /> Öne çıkar
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("published")} /> Yayında
      </label>
      <Button type="submit">{id ? "Değişiklikleri kaydet" : "Taslak veya yayını kaydet"}</Button>
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
