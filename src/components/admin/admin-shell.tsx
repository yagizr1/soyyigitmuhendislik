"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight,
  ChevronDown,
  ClipboardList,
  FileText,
  Folder,
  FolderOpen,
  House,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Search,
  Settings,
  SquarePen,
  Tags,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import type { Permission } from "@/lib/permissions";
import { can, type AppRole } from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  permission: Permission | null;
  icon: LucideIcon;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const PRIMARY: NavItem[] = [
  { href: "/admin/urunler", label: "Ürünler", permission: "products.write", icon: Package },
  { href: "/admin/kategoriler", label: "Kategoriler", permission: "categories.write", icon: Tags },
  { href: "/admin/teklifler", label: "Teklifler", permission: "quotes.write", icon: ClipboardList },
];

const GROUPS: NavGroup[] = [
  {
    id: "site",
    label: "Site",
    items: [
      { href: "/admin/anasayfa", label: "Ana sayfa", permission: "homepage.write", icon: House },
      { href: "/admin/sayfalar", label: "Sayfalar", permission: "pages.write", icon: FileText },
      { href: "/admin/sss", label: "SSS", permission: "faqs.write", icon: SquarePen },
      { href: "/admin/medya", label: "Medya", permission: "media.write", icon: Images },
      { href: "/admin/seo", label: "SEO", permission: "seo.write", icon: Search },
    ],
  },
  {
    id: "sistem",
    label: "Sistem",
    items: [
      { href: "/admin/ayarlar", label: "Ayarlar", permission: "settings.write", icon: Settings },
      { href: "/admin/kullanicilar", label: "Kullanıcılar", permission: "users.write", icon: Users },
      { href: "/admin/yonlendirmeler", label: "Yönlendirmeler", permission: "redirects.write", icon: ArrowLeftRight },
      { href: "/admin/denetim", label: "Denetim", permission: "audit.read", icon: ScrollText },
    ],
  },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  name,
  role,
  children,
}: {
  name: string;
  role: AppRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const primary = PRIMARY.filter((item) => !item.permission || can(role, item.permission));
  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || can(role, item.permission)),
  })).filter((group) => group.items.length > 0);

  function groupIsOpen(group: NavGroup) {
    if (group.id in openGroups) return openGroups[group.id];
    return group.items.some((item) => isCurrent(pathname, item.href));
  }

  function toggleGroup(id: string, open: boolean) {
    setOpenGroups((current) => ({ ...current, [id]: !open }));
  }

  const nav = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 px-4 py-4">
        <p className="text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">Yönetim</p>
        <p className="mt-1 font-display text-2xl leading-none">Panel</p>
      </div>
      <nav aria-label="Yönetim menüsü" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        <Link
          href="/admin"
          aria-current={isCurrent(pathname, "/admin") ? "page" : undefined}
          className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${
            isCurrent(pathname, "/admin") ? "bg-white text-steel" : "text-white/90 hover:bg-white/10"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <LayoutDashboard aria-hidden="true" className="size-4" />
          Özet
        </Link>
        {primary.map((item) => {
          const Icon = item.icon;
          const current = isCurrent(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current ? "bg-white text-steel" : "text-white/90 hover:bg-white/10"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
          );
        })}
        {groups.map((group) => {
          const open = groupIsOpen(group);
          const FolderIcon = open ? FolderOpen : Folder;
          return (
            <div key={group.id} className="pt-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-white/90 hover:bg-white/10"
                aria-expanded={open}
                onClick={() => toggleGroup(group.id, open)}
              >
                <FolderIcon aria-hidden="true" className="size-4 text-[#f3d48a]" />
                <span className="flex-1">{group.label}</span>
                <ChevronDown aria-hidden="true" className={`size-4 text-white/50 transition ${open ? "rotate-0" : "-rotate-90"}`} />
              </button>
              {open ? (
                <div className="mt-1 ml-4 grid gap-0.5 border-l border-white/15 pl-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const current = isCurrent(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={current ? "page" : undefined}
                        className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm ${
                          current ? "bg-white font-semibold text-steel" : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon aria-hidden="true" className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="px-2 text-sm font-semibold">{name}</p>
        <p className="px-2 text-xs text-white/55">{role === "ADMIN" ? "Yönetici" : "Editör"}</p>
        <Link
          href="/admin/hesap"
          aria-current={isCurrent(pathname, "/admin/hesap") ? "page" : undefined}
          className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            isCurrent(pathname, "/admin/hesap") ? "bg-white font-semibold text-steel" : "text-white/85 hover:bg-white/10"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <UserRound aria-hidden="true" className="size-4" />
          Hesabım
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/10">
            <LogOut aria-hidden="true" className="size-4" />
            Çıkış
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[17.5rem_1fr]">
      {mobileOpen ? (
        <button type="button" className="fixed inset-0 z-40 bg-steel/50 lg:hidden" aria-label="Menüyü kapat" onClick={() => setMobileOpen(false)} />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-steel text-white shadow-xl transition-transform lg:static lg:z-auto lg:w-auto lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold lg:hidden"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
            Menü
          </button>
          <p className="hidden text-sm text-muted lg:block">İçerik ve katalog yönetimi</p>
          <Link href="/" className="ml-auto text-sm font-semibold text-accent">
            Siteyi gör
          </Link>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
