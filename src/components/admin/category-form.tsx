"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCategory, saveCategorySpecFields } from "@/actions/categories";
import { Button } from "@/components/ui/button";

type Spec = { key: string; label: string; unit: string; filterable: boolean; sortOrder: number };

export function CategoryForm({
  id,
  category,
  parents,
  media,
  specFields,
}: {
  id: string | null;
  category: {
    name: string;
    slug: string;
    description: string;
    parentId: string;
    sortOrder: number;
    published: boolean;
    seoTitle: string;
    seoDescription: string;
    imageId: string;
  };
  parents: { id: string; name: string }[];
  media: { id: string; alt: string }[];
  specFields: Spec[];
}) {
  const router = useRouter();
  return (
    <div className="grid max-w-3xl gap-8">
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await saveCategory(id, {
            name: String(form.get("name") ?? ""),
            slug: String(form.get("slug") ?? ""),
            description: String(form.get("description") ?? ""),
            parentId: String(form.get("parentId") ?? ""),
            sortOrder: Number(form.get("sortOrder") ?? 0),
            published: form.get("published") === "on",
            seoTitle: String(form.get("seoTitle") ?? ""),
            seoDescription: String(form.get("seoDescription") ?? ""),
            imageId: String(form.get("imageId") ?? ""),
          });
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          toast.success("Kategori kaydedildi.");
          if (!id) router.push(`/admin/kategoriler/${result.data.id}`);
          else router.refresh();
        }}
      >
        <input name="name" defaultValue={category.name} className="h-11 rounded-md border px-3" required />
        <input name="slug" defaultValue={category.slug} className="h-11 rounded-md border px-3" required />
        <textarea name="description" defaultValue={category.description} className="min-h-24 rounded-md border px-3 py-2" />
        <select name="parentId" defaultValue={category.parentId} className="h-11 rounded-md border px-3">
          <option value="">Üst kategori yok</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>{parent.name}</option>
          ))}
        </select>
        <select name="imageId" defaultValue={category.imageId} className="h-11 rounded-md border px-3">
          <option value="">Görsel yok</option>
          {media.map((item) => (
            <option key={item.id} value={item.id}>{item.alt || item.id}</option>
          ))}
        </select>
        <input name="sortOrder" type="number" defaultValue={category.sortOrder} className="h-11 rounded-md border px-3" />
        <input name="seoTitle" defaultValue={category.seoTitle} placeholder="SEO başlığı" className="h-11 rounded-md border px-3" />
        <input name="seoDescription" defaultValue={category.seoDescription} placeholder="Meta açıklama" className="h-11 rounded-md border px-3" />
        <label className="text-sm"><input type="checkbox" name="published" defaultChecked={category.published} /> Yayında</label>
        <Button type="submit">Kategoriyi kaydet</Button>
      </form>
      {id ? (
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const count = Number(form.get("count") ?? 0);
            const fields: Spec[] = [];
            for (let index = 0; index < count; index += 1) {
              const key = String(form.get(`key-${index}`) ?? "").trim();
              const label = String(form.get(`label-${index}`) ?? "").trim();
              if (!key && !label) continue;
              fields.push({
                key,
                label,
                unit: String(form.get(`unit-${index}`) ?? ""),
                filterable: form.get(`filter-${index}`) === "on",
                sortOrder: index,
              });
            }
            const result = await saveCategorySpecFields(id, fields);
            if (!result.ok) toast.error(result.message);
            else {
              toast.success("Teknik alanlar kaydedildi.");
              router.refresh();
            }
          }}
        >
          <h2 className="font-display text-2xl">Teknik alanlar</h2>
          <input type="hidden" name="count" value={Math.max(specFields.length + 1, 3)} />
          {Array.from({ length: Math.max(specFields.length + 1, 3) }).map((_, index) => {
            const field = specFields[index];
            return (
              <div key={index} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-4">
                <input name={`key-${index}`} defaultValue={field?.key ?? ""} placeholder="anahtar" className="h-11 rounded-md border px-2" />
                <input name={`label-${index}`} defaultValue={field?.label ?? ""} placeholder="Etiket" className="h-11 rounded-md border px-2" />
                <input name={`unit-${index}`} defaultValue={field?.unit ?? ""} placeholder="Birim" className="h-11 rounded-md border px-2" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name={`filter-${index}`} defaultChecked={field?.filterable ?? false} /> Filtre
                </label>
              </div>
            );
          })}
          <Button type="submit" variant="outline">Alanları kaydet</Button>
        </form>
      ) : null}
    </div>
  );
}
