import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Files, Trophy, Users } from "lucide-react";
import { AboutStrip } from "@/components/site/about-strip";
import { CountUp } from "@/components/site/count-up";
import { BrandStrip } from "@/components/site/brand-strip";
import { ProductCard } from "@/components/site/product-card";
import { SafeImage } from "@/components/site/safe-image";
import { getFeaturedProducts } from "@/lib/catalog";
import { getPublishedFaqs, getSeo } from "@/lib/content";
import { getCompany, getHome, mediaUrl } from "@/lib/settings";
import { absoluteUrl, jsonLdScript } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [home, seo] = await Promise.all([getHome(), getSeo("/")]);
  const title = seo?.title || home.hero.title;
  const description = seo?.description || home.hero.subtitle;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: seo?.canonical || "/" },
    robots: seo?.robots === "noindex,nofollow" ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title: seo?.ogTitle || title, description, url: "/" },
  };
}

export default async function HomePage() {
  const [company, home, featuredProducts, faqs] = await Promise.all([
    getCompany(),
    getHome(),
    getFeaturedProducts(),
    getPublishedFaqs(),
  ]);
  const heroImage = (await mediaUrl(home.hero.imageMediaId)) ?? "/photos/hero-depo.jpg";
  const visibleStats = home.stats.enabled
    ? home.stats.items.filter((item) => item.label.trim() && item.value.trim())
    : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: company.name, url: absoluteUrl("/") },
      ...(company.demo
        ? []
        : [
            {
              "@type": "Organization",
              name: company.name,
              url: absoluteUrl("/"),
              ...(company.phone ? { telephone: company.phone } : {}),
              ...(company.email ? { email: company.email } : {}),
              ...(company.address ? { address: company.address } : {}),
            },
          ]),
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      {home.hero.enabled ? (
        <section className="bg-[linear-gradient(160deg,#1e242b_0%,#323b45_48%,#1e242b_100%)] text-white">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
            <div>
              <p className="text-sm font-semibold tracking-wide text-orange-200">{home.hero.eyebrow}</p>
              <h1 className="mt-3 font-display text-4xl leading-tight font-semibold md:text-6xl">{home.hero.title}</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-200">{home.hero.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={home.hero.primaryCta.href} className="inline-flex h-12 items-center rounded-md bg-accent px-5 font-semibold text-white shadow-sm transition hover:brightness-110">
                  {home.hero.primaryCta.label}
                </Link>
                <Link href={home.hero.secondaryCta.href} className="inline-flex h-12 items-center rounded-md border border-white/30 px-5 font-semibold transition hover:bg-white/10">
                  {home.hero.secondaryCta.label}
                </Link>
              </div>
            </div>
            <div className="relative rounded-[1.4rem] bg-white/10 p-3 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.75)] ring-1 ring-white/25">
              <span className="pointer-events-none absolute top-5 left-5 h-8 w-8 rounded-tl-md border-t-2 border-l-2 border-[#f3d48a]" />
              <span className="pointer-events-none absolute right-5 bottom-5 h-8 w-8 rounded-br-md border-r-2 border-b-2 border-[#f3d48a]" />
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border-[5px] border-white bg-steel-2">
                <SafeImage src={heroImage} alt={home.hero.imageAlt || home.hero.title} priority sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {home.intro.enabled || visibleStats.length > 0 ? (
        <section id="ne-ise-yarar" className="scroll-mt-24 bg-white" aria-labelledby={home.intro.enabled ? "ne-ise-yarar-baslik" : undefined} aria-label={home.intro.enabled ? undefined : "Rakamlar"}>
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:gap-14 md:py-16">
            {home.intro.enabled ? (
              <div>
                <h2 id="ne-ise-yarar-baslik" className="font-display text-3xl tracking-tight text-zinc-900 md:text-4xl">
                  {home.intro.title}
                </h2>
                <span className="mt-4 block h-[3px] w-16 bg-[#f58220]" />
                <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">{home.intro.body}</p>
              </div>
            ) : null}
            {visibleStats.length > 0 ? (
              <dl className="grid grid-cols-2 gap-3 sm:gap-4">
                {visibleStats.map((item, index) => {
                  const Icon = [Files, FileText, Users, Trophy][index] ?? FileText;
                  return (
                    <div
                      key={item.label}
                      className="flex flex-col items-center rounded-xl border border-[#efe6dc] bg-[#faf8f6] px-3 py-6 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm">
                        <Icon className="size-5 text-[#f58220]" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <dd className="mt-3 font-display text-3xl font-semibold tracking-tight text-[#f58220] tabular-nums" aria-label={item.value}>
                        <CountUp value={item.value} />
                      </dd>
                      <dt className="mt-1 text-sm text-zinc-800">{item.label}</dt>
                    </div>
                  );
                })}
              </dl>
            ) : null}
          </div>
        </section>
      ) : null}

      <BrandStrip />
      <AboutStrip name={company.name} />

      {home.featured.enabled && featuredProducts.length > 0 ? (
        <section id="one-cikan" className="scroll-mt-24 bg-background pt-16 pb-14">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 className="font-display text-3xl">{home.featured.title}</h2>
            <p className="mt-2 text-muted">{home.featured.subtitle}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {home.faq.enabled && faqs.length > 0 ? (
        <section id="sss" className="scroll-mt-24">
          <div className="mx-auto w-full max-w-6xl px-4 py-14">
            <h2 className="font-display text-3xl">{home.faq.title}</h2>
            <p className="mt-2 text-muted">{home.faq.subtitle}</p>
            <div className="mt-6 space-y-3">
              {faqs.slice(0, 5).map((faq) => (
                <details key={faq.id} className="rounded-lg border border-border bg-card p-4">
                  <summary className="cursor-pointer font-semibold">{faq.question}</summary>
                  <p className="mt-2 leading-7 text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {home.cta.enabled ? (
        <section className="bg-accent text-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 text-center">
            <h2 className="text-4xl leading-tight font-semibold sm:text-5xl md:text-6xl" style={{ fontFamily: "var(--font-hand), cursive" }}>
              {home.cta.title}
            </h2>
          </div>
        </section>
      ) : null}
    </div>
  );
}
