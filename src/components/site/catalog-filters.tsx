"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { CatalogQuery } from "@/lib/catalog";

const fieldClass = "h-11 w-full rounded-md border border-border bg-card px-3";

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3 rounded-lg border border-border bg-background p-3">
      <legend className="px-1.5 text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

export function CatalogFilters({
  action,
  query,
  categories,
  profiles,
  grades,
  surfaces,
  hideCategory = false,
  hideSearch = false,
  formId,
}: {
  action: string;
  query: CatalogQuery;
  categories: { slug: string; name: string }[];
  profiles: string[];
  grades: string[];
  surfaces: string[];
  hideCategory?: boolean;
  hideSearch?: boolean;
  formId?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (media.matches && ref.current) ref.current.open = true;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <details ref={ref} open className="rounded-lg border border-border bg-card lg:contents">
      <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 font-semibold lg:hidden">
        Filtreler
      </summary>
      <form id={formId} action={action} method="get" className="grid gap-3 p-3 lg:sticky lg:top-24 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-4 lg:shadow-sm">
        {hideSearch ? null : (
          <FilterGroup title="Arama">
            <label className="grid gap-1 text-sm">
              Ürün adı veya kod
              <input name="q" defaultValue={query.q ?? ""} className={fieldClass} />
            </label>
          </FilterGroup>
        )}
        <FilterGroup title="Ürün">
          {hideCategory ? null : (
            <label className="grid gap-1 text-sm">
              Kategori
              <select name="kategori" defaultValue={query.kategori ?? ""} className={fieldClass}>
                <option value="">Tümü</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1 text-sm">
            Profil türü
            <select name="profil" defaultValue={query.profil ?? ""} className={fieldClass}>
              <option value="">Tümü</option>
              {profiles.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </FilterGroup>
        <FilterGroup title="Malzeme">
          <label className="grid gap-1 text-sm">
            Kalite sınıfı
            <select name="kalite" defaultValue={query.kalite ?? ""} className={fieldClass}>
              <option value="">Tümü</option>
              {grades.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Yüzey
            <select name="yuzey" defaultValue={query.yuzey ?? ""} className={fieldClass}>
              <option value="">Tümü</option>
              {surfaces.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </FilterGroup>
        <FilterGroup title="Ölçü">
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="col-span-2 text-sm">En (mm)</legend>
            <input name="enMin" defaultValue={query.enMin ?? ""} placeholder="Min" className={fieldClass} />
            <input name="enMax" defaultValue={query.enMax ?? ""} placeholder="Max" className={fieldClass} />
          </fieldset>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="col-span-2 text-sm">Boy (mm)</legend>
            <input name="boyMin" defaultValue={query.boyMin ?? ""} placeholder="Min" className={fieldClass} />
            <input name="boyMax" defaultValue={query.boyMax ?? ""} placeholder="Max" className={fieldClass} />
          </fieldset>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="col-span-2 text-sm">Et kalınlığı (mm)</legend>
            <input name="etMin" defaultValue={query.etMin ?? ""} placeholder="Min" className={fieldClass} />
            <input name="etMax" defaultValue={query.etMax ?? ""} placeholder="Max" className={fieldClass} />
          </fieldset>
        </FilterGroup>
        <FilterGroup title="Liste">
          <label className="grid gap-1 text-sm">
            Stok durumu
            <select name="stok" defaultValue={query.stok ?? ""} className={fieldClass}>
              <option value="">Tümü</option>
              <option value="IN_STOCK">Stokta</option>
              <option value="LOW_STOCK">Sınırlı stok</option>
              <option value="MADE_TO_ORDER">Sipariş üzerine</option>
              <option value="OUT_OF_STOCK">Stokta yok</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Sıralama
            <select name="siralama" defaultValue={query.siralama ?? "yeni"} className={fieldClass}>
              <option value="yeni">En yeni</option>
              <option value="ad">Ada göre</option>
              <option value="ad-azalan">Ada göre (Z-A)</option>
              <option value="kod">Ürün kodu</option>
              <option value="agirlik">kg/m</option>
            </select>
          </label>
        </FilterGroup>
        <div className="grid grid-cols-2 gap-2">
          <button type="submit" className="h-11 rounded-md bg-accent font-semibold text-white">
            Filtrele
          </button>
          <a href={action} className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card">
            Temizle
          </a>
        </div>
      </form>
    </details>
  );
}
