import { deleteMedia, updateMediaAlt, uploadMedia } from "@/actions/media";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { prisma } from "@/lib/prisma";
import { storageDriver } from "@/lib/storage";

export default async function MediaPage() {
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 80 });
  return (
    <div>
      <h1 className="font-display text-4xl">Medya</h1>
      <p className="mt-2 text-sm text-muted">Depolama: {storageDriver() === "s3" ? "S3" : "yerel klasör"}. JPEG, PNG, WebP veya AVIF, en fazla 5 MB.</p>
      <form
        action={async (formData) => {
          "use server";
          await uploadMedia(formData);
        }}
        className="mt-4 flex flex-wrap items-center gap-2"
      >
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required />
        <input name="alt" placeholder="Alternatif metin" className="h-11 rounded-md border px-3" />
        <button className="h-11 rounded-md bg-steel px-4 text-white">Yükle</button>
      </form>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {media.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-card p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt} className="h-36 w-full rounded object-cover" />
            <p className="mt-2 break-all text-xs text-muted">{item.id}</p>
            <form
              action={async (formData) => {
                "use server";
                await updateMediaAlt(item.id, formData);
              }}
              className="mt-2 flex gap-2"
            >
              <input name="alt" defaultValue={item.alt} className="h-11 flex-1 rounded-md border px-3" />
              <button className="h-11 px-3">Kaydet</button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteMedia(item.id);
              }}
            >
              <ConfirmSubmit className="mt-2 text-sm text-red-800" label="Sil" message="Bu görseli silmek istediğinize emin misiniz?" />
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
