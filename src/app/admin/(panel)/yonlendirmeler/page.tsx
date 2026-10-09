import { deleteRedirect, saveRedirect } from "@/actions/settings";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { prisma } from "@/lib/prisma";

export default async function RedirectsPage() {
  const redirects = await prisma.redirect.findMany({ orderBy: { fromPath: "asc" } });
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl">Yönlendirmeler</h1>
      <form
        className="mt-6 grid gap-2"
        action={async (formData) => {
          "use server";
          await saveRedirect(null, {
            fromPath: String(formData.get("fromPath") ?? ""),
            toPath: String(formData.get("toPath") ?? ""),
            statusCode: Number(formData.get("statusCode") ?? 301) === 302 ? 302 : 301,
            active: true,
          });
        }}
      >
        <input name="fromPath" placeholder="/eski-yol" className="h-11 rounded-md border px-3" required />
        <input name="toPath" placeholder="/yeni-yol" className="h-11 rounded-md border px-3" required />
        <select name="statusCode" className="h-11 rounded-md border px-3">
          <option value="301">301</option>
          <option value="302">302</option>
        </select>
        <button className="h-11 w-fit rounded-md bg-steel px-4 text-white">Ekle</button>
      </form>
      <ul className="mt-6 space-y-3">
        {redirects.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-card p-3 text-sm">
            <p>{item.fromPath} → {item.toPath} ({item.statusCode}) {item.active ? "" : "pasif"}</p>
            <form
              action={async () => {
                "use server";
                await deleteRedirect(item.id);
              }}
            >
              <ConfirmSubmit className="mt-2 text-red-800" label="Sil" message="Bu yönlendirmeyi silmek istediğinize emin misiniz?" />
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
