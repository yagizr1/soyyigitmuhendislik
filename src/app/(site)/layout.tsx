import { QuoteProvider } from "@/components/quote/quote-provider";
import { CookieNotice } from "@/components/site/cookie-notice";
import { ContactReach } from "@/components/site/contact-reach";
import { ContactReachGate } from "@/components/site/contact-reach-gate";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getFooterPages } from "@/lib/content";
import { getPublishedCategories } from "@/lib/catalog";
import { getCompany, getSocial } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [company, social, categories, footerPages] = await Promise.all([
    getCompany(),
    getSocial(),
    getPublishedCategories(),
    getFooterPages(),
  ]);

  return (
    <QuoteProvider>
      <div className="flex min-h-full flex-col">
        <SiteHeader
          name={company.name}
          categories={categories.map((category) => ({ href: `/kategori/${category.slug}`, label: category.name }))}
        />
        <main id="icerik" className="flex-1">
          {children}
        </main>
        <ContactReachGate>
          <ContactReach company={company} />
        </ContactReachGate>
        <SiteFooter
          company={company}
          social={social}
          pages={footerPages.map((page) => ({ href: `/${page.slug}`, label: page.navLabel || page.title }))}
        />
        <CookieNotice />
      </div>
    </QuoteProvider>
  );
}
