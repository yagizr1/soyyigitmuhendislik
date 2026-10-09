import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QUOTE_STATUS_LABELS } from "@/lib/units";

export default async function QuotesPage() {
  const quotes = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { select: { id: true } } },
    take: 100,
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Teklif ve ileti</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr>
              <th className="p-2">Tarih</th>
              <th className="p-2">Firma</th>
              <th className="p-2">Kaynak</th>
              <th className="p-2">Durum</th>
              <th className="p-2">Kalem</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id} className="border-t border-border">
                <td className="p-2">{quote.createdAt.toLocaleString("tr-TR")}</td>
                <td className="p-2">
                  <Link href={`/admin/teklifler/${quote.id}`} className="underline">{quote.companyName}</Link>
                </td>
                <td className="p-2">{quote.source === "CART" ? "Teklif listesi" : "İletişim"}</td>
                <td className="p-2">{QUOTE_STATUS_LABELS[quote.status]}</td>
                <td className="p-2">{quote.items.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
