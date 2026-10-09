import type { Metadata } from "next";
import { Barlow, Caveat, Source_Sans_3 } from "next/font/google";
import { AppToaster } from "@/components/providers/toaster";
import { getBrandAssets, getCompany } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--font-hand",
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompany();
  const { faviconUrl } = await getBrandAssets();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: company.name,
      template: `%s | ${company.name}`,
    },
    description: company.demo
      ? "Örnek demir profil kataloğu ve teklif sitesi."
      : `${company.name} ürün kataloğu ve teklif talebi.`,
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
    openGraph: { locale: "tr_TR", type: "website", siteName: company.name },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { brand } = await getBrandAssets();
  const accent = /^#[0-9a-fA-F]{6}$/.test(brand.accent) ? brand.accent : "#a33b12";
  return (
    <html lang="tr-TR" className={`${sourceSans.variable} ${barlow.variable} ${caveat.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <a href="#icerik" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3">
          İçeriğe geç
        </a>
        <style>{`:root { --accent: ${accent}; }`}</style>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
