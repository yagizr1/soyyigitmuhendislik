import Link from "next/link";
import { saveSeo } from "@/actions/content";
import { findBrokenInternalLinks } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { one } from "@/lib/search";

const PATHS = ["/", "/urunler", "/hakkimizda", "/kalite-ve-hizmetler", "/sektorler", "/sss", "/iletisim"];

export default async function SeoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const check = one((await searchParams).kontrol) === "1";
  const [entries, broken] = await Promise.all([
    prisma.seoMeta.findMany({ orderBy: { path: "asc" } }),
    check ? findBrokenInternalLinks() : Promise.resolve(null),
  ]);
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl">SEO</h1>
      <p className="mt-2 text-sm text-muted">Kayıt, arama sıralamasını garanti etmez. Ürün ve kategori SEO alanları kendi formlarındadır.</p>
      <Link href="/admin/seo?kontrol=1" className="mt-4 inline-flex h-11 items-center rounded-md border px-4">İç bağlantıları kontrol et</Link>
      {broken ? (
        <ul className="mt-4 text-sm">
          {broken.length === 0 ? <li>Kırık iç bağlantı bulunmadı.</li> : broken.map((item) => (
            <li key={`${item.page}-${item.href}`}>{item.page}: {item.href}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6 space-y-6">
        {PATHS.map((path) => {
          const entry = byPath.get(path);
          return (
            <form
              key={path}
              className="grid gap-2 rounded-lg border border-border bg-card p-4"
              action={async (formData) => {
                "use server";
                await saveSeo({
                  path,
                  title: String(formData.get("title") ?? ""),
                  description: String(formData.get("description") ?? ""),
                  canonical: String(formData.get("canonical") ?? ""),
                  ogTitle: String(formData.get("ogTitle") ?? ""),
                  robots: String(formData.get("robots") ?? "index,follow"),
                });
              }}
            >
              <p className="font-semibold">{path}</p>
              <input name="title" defaultValue={entry?.title ?? ""} placeholder="Başlık" className="h-11 rounded-md border px-3" />
              <input name="description" defaultValue={entry?.description ?? ""} placeholder="Açıklama" className="h-11 rounded-md border px-3" />
              <input name="canonical" defaultValue={entry?.canonical ?? ""} placeholder="Canonical" className="h-11 rounded-md border px-3" />
              <input name="ogTitle" defaultValue={entry?.ogTitle ?? ""} placeholder="Open Graph başlığı" className="h-11 rounded-md border px-3" />
              <select name="robots" defaultValue={entry?.robots ?? "index,follow"} className="h-11 rounded-md border px-3">
                <option value="index,follow">index, follow</option>
                <option value="noindex,follow">noindex, follow</option>
                <option value="noindex,nofollow">noindex, nofollow</option>
              </select>
              <button className="h-11 w-fit rounded-md bg-steel px-4 text-white">Kaydet</button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
