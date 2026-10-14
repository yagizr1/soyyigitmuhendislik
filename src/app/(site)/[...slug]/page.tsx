import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { findRedirect } from "@/lib/catalog";
import { getPublishedFaqs, getPublishedPage } from "@/lib/content";
import { sanitizeRichText } from "@/lib/sanitize";
import { getCompany } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug.length !== 1) return { title: "Sayfa" };
  const page = await getPublishedPage(slug[0] ?? "");
  if (!page) return { title: "Sayfa" };
  const robots = page.robots.split(",");
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.excerpt || page.title,
    alternates: { canonical: page.canonicalPath || `/${page.slug}` },
    robots: {
      index: robots[0] !== "noindex",
      follow: robots[1] !== "nofollow",
    },
    openGraph: { title: page.ogTitle || page.seoTitle || page.title },
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  const jump = await findRedirect(path);
  if (jump) {
    if (jump.statusCode === 302) redirect(jump.toPath);
    permanentRedirect(jump.toPath);
  }
  if (slug.length !== 1) notFound();
  const page = await getPublishedPage(slug[0] ?? "");
  if (!page) notFound();
  const [faqs, company] = await Promise.all([
    page.slug === "sss" ? getPublishedFaqs() : Promise.resolve([]),
    page.slug === "iletisim" ? getCompany() : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Ana sayfa", path: "/" }, { name: page.title, path: `/${page.slug}` }]} />
      <h1 className="mt-4 font-display text-4xl">{page.title}</h1>
      {page.excerpt ? <p className="mt-3 max-w-3xl text-lg text-muted">{page.excerpt}</p> : null}
      <div className="rich-text mt-6 max-w-3xl" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.content) }} />
      {page.slug === "sss" ? (
        <div className="mt-8 max-w-3xl space-y-3">
          {faqs.map((faq) => (
            <details key={faq.id} className="rounded-lg border border-border bg-card p-4">
              <summary className="cursor-pointer font-semibold">{faq.question}</summary>
              <p className="mt-2 leading-7">{faq.answer}</p>
            </details>
          ))}
        </div>
      ) : null}
      {page.slug === "iletisim" && company ? (
        <div className="mt-8 max-w-3xl space-y-2">
          {company.phone ? <p>Telefon: {company.phone}</p> : null}
          {company.email ? <p>E-posta: {company.email}</p> : null}
          {company.address ? (
            <p>Adres: {[company.address, company.city].filter((part) => part.trim()).join(", ")}</p>
          ) : null}
          {company.hours ? <p>Saatler: {company.hours}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
