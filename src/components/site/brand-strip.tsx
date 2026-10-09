const brands = [
  { name: "YUMA", src: "/brands/yuma.png" },
  { name: "KUPA", src: "/brands/kupa.svg" },
  { name: "Beybi", src: "/brands/beybi.svg" },
  { name: "KALE KİLİT", src: "/brands/kale.svg" },
  { name: "Makita", src: "/brands/makita.png" },
  { name: "ELTOS", src: "/brands/eltos.png" },
  { name: "İZELTAŞ", src: "/brands/izeltas.svg" },
  { name: "BEST", src: "" },
] as const;

export function BrandStrip() {
  return (
    <section id="markalar" className="scroll-mt-24 bg-[#f7f7f8]" aria-labelledby="markalar-baslik">
      <div className="mx-auto w-full max-w-5xl px-4 py-14 text-center">
        <h2 id="markalar-baslik" className="text-2xl font-semibold tracking-tight text-zinc-900">
          Markalar
        </h2>
        <span className="mx-auto mt-2 block h-0.5 w-14 bg-[#f58220]" />
        <p className="mt-4 text-sm text-zinc-500">Sizlere hizmet sunduğumuz bazı markalar</p>
        <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          {brands.map((brand) => (
            <li
              key={brand.name}
              className="flex flex-col items-center rounded-lg border border-[#efe6dc] bg-white px-4 py-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-16 w-full items-center justify-center">
                {brand.src ? (
                  // Logos are local brand assets, including SVG files.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.src} alt={`${brand.name} logosu`} className="max-h-14 w-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold tracking-tight text-[#e10600]">{brand.name}</span>
                )}
              </div>
              <p className="mt-3 text-xs font-medium tracking-wide text-zinc-700">{brand.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
