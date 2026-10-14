import { SafeImage } from "@/components/site/safe-image";

export function AboutStrip({ name }: { name: string }) {
  return (
    <section id="hakkimizda" className="scroll-mt-24 bg-white" aria-labelledby="hakkimizda-baslik">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 id="hakkimizda-baslik" className="text-[32px] font-bold tracking-wide text-zinc-900">
            Hakkımızda
          </h2>
          <span className="mx-auto mt-4 mb-10 block h-[3px] w-[100px] bg-[#ff871c]" />
        </div>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-[5/4] overflow-hidden rounded-lg bg-[#f4f5f7] shadow-sm">
            <SafeImage src="/photos/about.jpg" alt="Atölyede çelik kaynak" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
          <div>
            <h3 className="border-b border-[#dddddd] pb-2.5 text-[34px] leading-tight font-bold text-zinc-900">{name}</h3>
            <p className="mt-5 text-[19px] leading-relaxed text-zinc-900">
              Çelik profil kataloğundan ürün kodu, ölçü ve miktar seçerek teklif listesi oluşturabilirsiniz. İşletme
              Erenler, Sakarya’dadır.
            </p>
            <p className="mt-5 text-[19px] leading-relaxed text-zinc-900">
              Yayınlanan kayıtlar tanıtım amaçlıdır. Fiyat sitede ilan edilmez; seçilen ürünler teklif üzerine değerlendirilir.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
