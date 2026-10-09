import Link from "next/link";
import type { CompanySettings, SocialSettings } from "@/lib/defaults";

export function SiteFooter({
  company,
  social,
  pages,
}: {
  company: CompanySettings;
  social: SocialSettings;
  pages: { href: string; label: string }[];
}) {
  const socials = [
    ["LinkedIn", social.linkedin],
    ["Instagram", social.instagram],
    ["Facebook", social.facebook],
    ["YouTube", social.youtube],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const linkClass = "inline-flex rounded-md px-2 py-1.5 transition hover:bg-white/15";

  return (
    <footer className="mt-auto bg-accent text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl tracking-tight">{company.name}</p>
          <span className="mt-4 block h-[3px] w-16 rounded-full bg-[#f3d48a]" />
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/85">{company.footerNote}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#f3d48a] uppercase">Sayfalar</p>
          <ul className="mt-4 space-y-1 text-sm">
            <li>
              <Link href="/urunler" className={linkClass}>
                Ürünler
              </Link>
            </li>
            {pages.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className={linkClass}>
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#f3d48a] uppercase">İletişim</p>
          <ul className="mt-4 space-y-2 text-sm text-white/90">
            {company.phone ? <li>{company.phone}</li> : null}
            {company.email ? (
              <li>
                <a href={`mailto:${company.email}`} className={linkClass}>
                  {company.email}
                </a>
              </li>
            ) : null}
            {company.address ? <li>{company.address}</li> : null}
            {!company.phone && !company.email && !company.address ? (
              <li className="text-white/80">İletişim bilgisi henüz girilmedi.</li>
            ) : null}
          </ul>
          {socials.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2 text-sm">
              {socials.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className={linkClass} rel="noreferrer">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
