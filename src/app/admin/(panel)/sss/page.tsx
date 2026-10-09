import { deleteFaq, saveFaq } from "@/actions/content";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { prisma } from "@/lib/prisma";

export default async function FaqAdminPage() {
  const faqs = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl">Sıkça sorulan sorular</h1>
      <form
        className="mt-6 grid gap-2 rounded-lg border border-border bg-card p-4"
        action={async (formData) => {
          "use server";
          await saveFaq(null, {
            question: String(formData.get("question") ?? ""),
            answer: String(formData.get("answer") ?? ""),
            sortOrder: Number(formData.get("sortOrder") ?? faqs.length),
            published: true,
          });
        }}
      >
        <h2 className="font-semibold">Yeni soru</h2>
        <input name="question" className="h-11 rounded-md border px-3" required />
        <textarea name="answer" className="min-h-24 rounded-md border px-3 py-2" required />
        <input name="sortOrder" type="number" defaultValue={faqs.length} className="h-11 rounded-md border px-3" />
        <button className="h-11 w-fit rounded-md bg-steel px-4 text-white">Ekle</button>
      </form>
      <ul className="mt-6 space-y-4">
        {faqs.map((faq) => (
          <li key={faq.id} className="rounded-lg border border-border bg-card p-4">
            <form
              className="grid gap-2"
              action={async (formData) => {
                "use server";
                await saveFaq(faq.id, {
                  question: String(formData.get("question") ?? ""),
                  answer: String(formData.get("answer") ?? ""),
                  sortOrder: Number(formData.get("sortOrder") ?? 0),
                  published: formData.get("published") === "on",
                });
              }}
            >
              <input name="question" defaultValue={faq.question} className="h-11 rounded-md border px-3" />
              <textarea name="answer" defaultValue={faq.answer} className="min-h-24 rounded-md border px-3 py-2" />
              <input name="sortOrder" type="number" defaultValue={faq.sortOrder} className="h-11 rounded-md border px-3" />
              <label className="text-sm"><input type="checkbox" name="published" defaultChecked={faq.published} /> Yayında</label>
              <button className="h-11 w-fit rounded-md border px-4">Güncelle</button>
            </form>
            <form
              className="mt-2"
              action={async () => {
                "use server";
                await deleteFaq(faq.id);
              }}
            >
              <ConfirmSubmit className="text-sm text-red-800" label="Sil" message="Bu soruyu silmek istediğinize emin misiniz?" />
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
