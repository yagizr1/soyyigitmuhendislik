import { notFound } from "next/navigation";
import { updateQuoteStatus } from "@/actions/quotes";
import { prisma } from "@/lib/prisma";
import { QUOTE_STATUS_LABELS, UNIT_LABELS } from "@/lib/units";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await prisma.quoteRequest.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: "asc" } } } });
  if (!quote) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl">{quote.companyName}</h1>
      <p className="mt-2 text-sm text-muted">{quote.createdAt.toLocaleString("tr-TR")} · {quote.source === "CART" ? "Teklif listesi" : "İletişim formu"}</p>
      <dl className="mt-4 grid gap-2 text-sm">
        <div>İlgili: {quote.contactName || "—"}</div>
        <div>Telefon: {quote.phone || "—"}</div>
        <div>E-posta: {quote.email || "—"}</div>
        <div>Onay: {quote.consent ? "Evet" : "Hayır"}</div>
      </dl>
      {quote.note ? <p className="mt-4 whitespace-pre-line rounded-md bg-card p-3">{quote.note}</p> : null}
      <ul className="mt-4 space-y-2">
        {quote.items.map((item) => (
          <li key={item.id} className="rounded-md border border-border bg-card p-3">
            {item.productName} · {item.sku} · {item.quantity.toString()} {UNIT_LABELS[item.unit]}
          </li>
        ))}
      </ul>
      <form
        className="mt-6 flex gap-2"
        action={async (formData) => {
          "use server";
          await updateQuoteStatus(id, String(formData.get("status") ?? ""));
        }}
      >
        <select name="status" defaultValue={quote.status} className="h-11 rounded-md border px-3">
          {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button className="h-11 rounded-md bg-steel px-4 text-white">Durumu kaydet</button>
      </form>
    </div>
  );
}
