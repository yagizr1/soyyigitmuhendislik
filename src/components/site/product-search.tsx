"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SearchQuery = {
  q?: string;
  kategori?: string;
  profil?: string;
  kalite?: string;
  stok?: string;
  yuzey?: string;
  enMin?: string;
  enMax?: string;
  boyMin?: string;
  boyMax?: string;
  etMin?: string;
  etMax?: string;
  siralama?: string;
};

function searchHref(action: string, query: SearchQuery, q: string) {
  const params = new URLSearchParams();
  const fields: [string, string | undefined][] = [
    ["q", q],
    ["kategori", query.kategori],
    ["profil", query.profil],
    ["kalite", query.kalite],
    ["stok", query.stok],
    ["yuzey", query.yuzey],
    ["enMin", query.enMin],
    ["enMax", query.enMax],
    ["boyMin", query.boyMin],
    ["boyMax", query.boyMax],
    ["etMin", query.etMin],
    ["etMax", query.etMax],
    ["siralama", query.siralama && query.siralama !== "yeni" ? query.siralama : undefined],
  ];
  for (const [key, value] of fields) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `${action}?${text}` : action;
}

export function ProductSearch({ query, action }: { query: SearchQuery; action: string }) {
  const router = useRouter();
  const focused = useRef(false);
  const [value, setValue] = useState(query.q ?? "");

  useEffect(() => {
    if (focused.current) return;
    setValue(query.q ?? "");
  }, [query.q]);

  useEffect(() => {
    const q = value.trim();
    if (q === (query.q ?? "")) return;
    const timer = window.setTimeout(() => {
      router.replace(searchHref(action, query, q), { scroll: false });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [action, value, query, router]);

  return (
    <label className="relative block w-full max-w-[36rem]">
      <span className="sr-only">Ürün aratın</span>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted/70" />
      <input
        form="katalog-filtre"
        name="q"
        value={value}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
        }}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ürün aratın"
        autoComplete="off"
        className="h-12 w-full rounded-full border border-black/10 bg-card pr-5 pl-12 text-base shadow-[0_1px_6px_rgba(32,33,36,0.16)] outline-none placeholder:text-foreground/35 hover:shadow-[0_1px_8px_rgba(32,33,36,0.22)] focus:shadow-[0_2px_10px_rgba(32,33,36,0.24)]"
      />
    </label>
  );
}
