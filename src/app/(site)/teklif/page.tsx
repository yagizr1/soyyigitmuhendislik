import type { Metadata } from "next";
import { QuoteCart } from "@/components/quote/quote-cart";
import { getCompany } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Teklif listesi",
  description: "Seçilen ürünler için WhatsApp teklif taslağı oluşturun.",
  robots: { index: false, follow: false },
};

export default async function QuotePage() {
  const company = await getCompany();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl">Teklif listesi</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Birden fazla ürünü tek listede toplayın. Liste toplamı para tutarı göstermez.
      </p>
      <div className="mt-6">
        <QuoteCart whatsappNumber={company.whatsapp} />
      </div>
    </div>
  );
}
