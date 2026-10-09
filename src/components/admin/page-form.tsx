"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { savePage } from "@/actions/content";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PageForm({
  id,
  page,
}: {
  id: string;
  page: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    published: boolean;
    showInNav: boolean;
    showInFooter: boolean;
    navLabel: string;
    sortOrder: number;
    seoTitle: string;
    seoDescription: string;
    canonicalPath: string;
    ogTitle: string;
    robots: "index,follow" | "noindex,follow" | "noindex,nofollow";
  };
}) {
  const router = useRouter();
  const [content, setContent] = useState(page.content);
  return (
    <form
      className="grid max-w-3xl gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const result = await savePage(id, {
          title: String(form.get("title") ?? ""),
          slug: String(form.get("slug") ?? ""),
          excerpt: String(form.get("excerpt") ?? ""),
          content,
          published: form.get("published") === "on",
          showInNav: form.get("showInNav") === "on",
          showInFooter: form.get("showInFooter") === "on",
          navLabel: String(form.get("navLabel") ?? ""),
          sortOrder: Number(form.get("sortOrder") ?? 0),
          seoTitle: String(form.get("seoTitle") ?? ""),
          seoDescription: String(form.get("seoDescription") ?? ""),
          canonicalPath: String(form.get("canonicalPath") ?? ""),
          ogTitle: String(form.get("ogTitle") ?? ""),
          robots: String(form.get("robots") ?? "index,follow"),
        });
        if (!result.ok) toast.error(result.message);
        else {
          toast.success("Sayfa kaydedildi.");
          router.refresh();
        }
      }}
    >
      <input name="title" defaultValue={page.title} className="h-11 rounded-md border px-3" required />
      <input name="slug" defaultValue={page.slug} className="h-11 rounded-md border px-3" required />
      <input name="excerpt" defaultValue={page.excerpt} className="h-11 rounded-md border px-3" />
      <RichTextEditor value={content} onChange={setContent} />
      <label className="text-sm"><input type="checkbox" name="published" defaultChecked={page.published} /> Yayında</label>
      <label className="text-sm"><input type="checkbox" name="showInNav" defaultChecked={page.showInNav} /> Menüde göster</label>
      <label className="text-sm"><input type="checkbox" name="showInFooter" defaultChecked={page.showInFooter} /> Altbilgide göster</label>
      <Input name="navLabel" defaultValue={page.navLabel} placeholder="Menü etiketi" />
      <Input name="sortOrder" type="number" defaultValue={page.sortOrder} />
      <Input name="seoTitle" defaultValue={page.seoTitle} placeholder="SEO başlığı" />
      <Input name="seoDescription" defaultValue={page.seoDescription} placeholder="Meta açıklama" />
      <Input name="canonicalPath" defaultValue={page.canonicalPath} placeholder="Canonical yol" />
      <Input name="ogTitle" defaultValue={page.ogTitle} placeholder="Open Graph başlığı" />
      <select name="robots" defaultValue={page.robots} className="h-11 rounded-md border px-3">
        <option value="index,follow">index, follow</option>
        <option value="noindex,follow">noindex, follow</option>
        <option value="noindex,nofollow">noindex, nofollow</option>
      </select>
      <Button type="submit">Kaydet</Button>
    </form>
  );
}
