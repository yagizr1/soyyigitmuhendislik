import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/page-form";
import { prisma } from "@/lib/prisma";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();
  const robots = page.robots === "noindex,nofollow" || page.robots === "noindex,follow" ? page.robots : "index,follow";
  return (
    <div>
      <h1 className="font-display text-4xl">{page.title}</h1>
      <div className="mt-6">
        <PageForm
          id={page.id}
          page={{
            title: page.title,
            slug: page.slug,
            excerpt: page.excerpt ?? "",
            content: page.content,
            published: page.published,
            showInNav: page.showInNav,
            showInFooter: page.showInFooter,
            navLabel: page.navLabel ?? "",
            sortOrder: page.sortOrder,
            seoTitle: page.seoTitle ?? "",
            seoDescription: page.seoDescription ?? "",
            canonicalPath: page.canonicalPath ?? "",
            ogTitle: page.ogTitle ?? "",
            robots,
          }}
        />
      </div>
    </div>
  );
}
