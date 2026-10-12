"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { importProductsXlsx } from "@/actions/products";

export function ProductImportForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  return (
    <form
      className="mt-4 grid gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setPending(true);
        setErrors([]);
        const result = await importProductsXlsx(new FormData(form));
        setPending(false);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setErrors(result.data.errors);
        if (result.data.created === 0) {
          toast.error(result.data.errors[0] ?? "Ürün eklenmedi.");
          return;
        }
        toast.success(`${result.data.created} ürün eklendi.`);
        form.reset();
        router.refresh();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          name="file"
          accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="text-sm"
          required
          disabled={pending}
        />
        <button className="h-11 rounded-md border border-border px-4" disabled={pending}>
          {pending ? "Aktarılıyor" : "Excel içe aktar"}
        </button>
      </div>
      <p className="text-sm text-muted">
        .xls ve .xlsx kabul edilir. İlk satır sütun başlıklarıdır. Alttaki her satır, o sütunlardaki bilgilerle bir ürün olarak eklenir.
      </p>
      {errors.length > 0 ? (
        <ul className="list-disc pl-5 text-sm text-red-700">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
