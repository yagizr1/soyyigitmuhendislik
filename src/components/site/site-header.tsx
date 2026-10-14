"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Menu, ShoppingCart, X } from "lucide-react";
import { useQuote } from "@/components/quote/quote-provider";
type LinkItem = { href: string; label: string };

const homeSections: LinkItem[] = [
  { href: "/#ne-ise-yarar", label: "Ne işe yarar?" },
  { href: "/#markalar", label: "Markalar" },
  { href: "/#hakkimizda", label: "Hakkımızda" },
  { href: "/#one-cikan", label: "Öne çıkanlar" },
  { href: "/#sss", label: "Sıkça sorulan sorular" },
  { href: "/#bize-ulasin", label: "Bize Ulaşın" },
];

function scrollToSection(href: string) {
  const id = href.split("#")[1];
  if (!id || window.location.pathname !== "/") return false;
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.pushState(null, "", href);
  return true;
}

function ProductsMenu({
  categories,
  onNavigate,
  variant,
}: {
  categories: LinkItem[];
  onNavigate?: () => void;
  variant: "dropdown" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open || variant !== "dropdown") return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, variant]);

  function close() {
    window.setTimeout(() => {
      setOpen(false);
      onNavigate?.();
    }, 0);
  }

  const links = (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-[0_22px_50px_-28px_rgba(30,36,43,0.7)] ring-1 ring-black/5">
      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.16em] text-zinc-400 uppercase">Katalog</p>
      <Link
        href="/urunler"
        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-zinc-50"
        onClick={close}
      >
        Tüm ürünler
        <span aria-hidden="true" className="text-zinc-400">
          →
        </span>
      </Link>
      <div className="mx-2 my-1 h-px bg-zinc-100" />
      {categories.map((category) => (
        <Link
          key={category.href}
          href={category.href}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80 transition hover:bg-[#fff4ec] hover:text-foreground"
          onClick={close}
        >
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent" />
          {category.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div ref={rootRef} className={variant === "dropdown" ? "relative" : undefined}>
      <button
        type="button"
        className={`flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 font-medium transition hover:bg-zinc-100 ${variant === "inline" ? "w-full" : "shrink-0"} ${open ? "bg-zinc-100" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        Ürünler
        <ChevronDown aria-hidden="true" className={`size-4 text-zinc-500 transition duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {variant === "dropdown" ? (
        <div
          id={panelId}
          inert={!open}
          aria-hidden={!open}
          className={`absolute top-[calc(100%+0.35rem)] left-0 z-30 w-72 origin-top transition duration-200 ${
            open ? "visible translate-y-0 scale-100 opacity-100" : "pointer-events-none invisible -translate-y-1 scale-[0.98] opacity-0"
          }`}
        >
          {links}
        </div>
      ) : (
        <div id={panelId} hidden={!open} className="px-1 pt-1 pb-2">
          {links}
        </div>
      )}
    </div>
  );
}

function NavLinks({
  categories,
  onNavigate,
  variant,
}: {
  categories: LinkItem[];
  onNavigate?: () => void;
  variant: "dropdown" | "inline";
}) {
  return (
    <>
      <ProductsMenu categories={categories} onNavigate={onNavigate} variant={variant} />
      {homeSections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-md px-3 hover:bg-zinc-100"
          onClick={(event) => {
            if (scrollToSection(section.href)) event.preventDefault();
            onNavigate?.();
          }}
        >
          {section.label}
        </Link>
      ))}
    </>
  );
}

export function SiteHeader({
  name,
  categories,
}: {
  name: string;
  categories: LinkItem[];
}) {
  const { ready, items } = useQuote();
  const count = ready ? items.length : 0;
  const [open, setOpen] = useState(false);

  const brand = (
    <Link href="/" className="flex shrink-0 items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/soyyigit-logo.png" alt={name} className="h-12 w-auto sm:h-16" />
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2">
        {brand}
        <nav aria-label="Ana menü" className="relative hidden items-center gap-1 xl:flex">
          <NavLinks categories={categories} variant="dropdown" />
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/teklif" className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 font-semibold text-white transition hover:brightness-110">
            <ShoppingCart aria-hidden="true" className="size-5" />
            Ürün sepeti{count > 0 ? ` (${count})` : ""}
          </Link>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button type="button" className="inline-flex size-11 items-center justify-center rounded-md border border-border xl:hidden" aria-label="Menüyü aç">
                <Menu aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-steel/70" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,20rem)] flex-col bg-card p-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="font-display text-xl">Menü</Dialog.Title>
                  <Dialog.Close className="inline-flex size-11 items-center justify-center" aria-label="Menüyü kapat">
                    <X aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <nav aria-label="Mobil menü" className="mt-4 flex flex-col">
                  <NavLinks categories={categories} variant="inline" onNavigate={() => setOpen(false)} />
                </nav>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}