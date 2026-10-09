"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { bulkProducts, deleteProduct, duplicateProduct } from "@/actions/products";
import { Button } from "@/components/ui/button";

export function ProductTable({
  rows,
}: {
  rows: { id: string; name: string; sku: string; published: boolean; featured: boolean; category: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  async function run(action: "publish" | "unpublish" | "feature" | "unfeature" | "delete") {
    if (action === "delete" && !confirm("Seçili ürünler silinsin mi?")) return;
    const result = await bulkProducts(selected, action);
    if (!result.ok) toast.error(result.message);
    else {
      toast.success("Toplu işlem tamamlandı.");
      setSelected([]);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => run("publish")}>Yayınla</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => run("unpublish")}>Yayından kaldır</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => run("feature")}>Öne çıkar</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => run("unfeature")}>Öne çıkarmayı kaldır</Button>
        <Button type="button" size="sm" variant="danger" onClick={() => run("delete")}>Seçilenleri sil</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="p-3">Seç</th>
              <th className="p-3">Ürün</th>
              <th className="p-3">Kod</th>
              <th className="p-3">Durum</th>
              <th className="p-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="p-3">
                  <input
                    type="checkbox"
                    aria-label={`${row.name} seç`}
                    checked={selected.includes(row.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id),
                      )
                    }
                  />
                </td>
                <td className="p-3">
                  <Link href={`/admin/urunler/${row.id}`} className="font-medium underline">{row.name}</Link>
                  <p className="text-muted">{row.category}</p>
                </td>
                <td className="p-3">{row.sku}</td>
                <td className="p-3">{row.published ? "Yayında" : "Taslak"}{row.featured ? " · öne çıkan" : ""}</td>
                <td className="p-3">
                  <button
                    type="button"
                    className="mr-3 underline"
                    onClick={async () => {
                      const result = await duplicateProduct(row.id);
                      if (!result.ok) toast.error(result.message);
                      else router.push(`/admin/urunler/${result.data.id}`);
                    }}
                  >
                    Kopyala
                  </button>
                  <button
                    type="button"
                    className="text-red-800 underline"
                    onClick={async () => {
                      if (!confirm("Bu ürün silinsin mi?")) return;
                      const result = await deleteProduct(row.id);
                      if (!result.ok) toast.error(result.message);
                      else router.refresh();
                    }}
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
