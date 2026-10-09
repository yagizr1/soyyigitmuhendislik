import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-4 py-16">
      <p className="text-sm font-semibold tracking-wide text-accent">404</p>
      <h1 className="mt-2 font-display text-4xl">Sayfa bulunamadı</h1>
      <p className="mt-3 text-muted">Adres değişmiş veya hiç yayınlanmamış olabilir.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-md bg-steel px-4 font-semibold text-white">
          Ana sayfa
        </Link>
        <Link href="/urunler" className="inline-flex h-11 items-center rounded-md border border-border px-4 font-semibold">
          Ürünler
        </Link>
      </div>
    </div>
  );
}
