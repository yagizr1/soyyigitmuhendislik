import type { CompanySettings } from "@/lib/defaults";
import { googleMapEmbedSrc } from "@/lib/map-embed";
import { ContactForm } from "@/components/site/contact-form";

function telHref(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (!/^\+?\d{7,15}$/.test(cleaned)) return null;
  return `tel:${cleaned}`;
}

export function ContactReach({ company }: { company: CompanySettings }) {
  const embedSrc = googleMapEmbedSrc(company);
  const location = [company.address, company.city].filter((part) => part.trim()).join(", ");
  const phoneHref = company.phone ? telHref(company.phone) : null;
  const details = [
    company.phone
      ? { label: "Telefon", value: company.phone, href: phoneHref }
      : null,
    company.email ? { label: "E-posta", value: company.email, href: `mailto:${company.email}` } : null,
    location ? { label: "Adres", value: location, href: null } : null,
    company.hours ? { label: "Çalışma saatleri", value: company.hours, href: null } : null,
  ].filter((item): item is { label: string; value: string; href: string | null } => Boolean(item));

  return (
    <section className="scroll-mt-24 border-t border-border bg-white" aria-labelledby="bize-ulasin-baslik" id="bize-ulasin">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 id="bize-ulasin-baslik" className="text-[32px] font-bold tracking-wide text-zinc-900">
            Bize Ulaşın
          </h2>
          <span className="mx-auto mt-4 mb-10 block h-[3px] w-[100px] bg-[#ff871c]" />
        </div>
        <div className="grid items-stretch gap-8 lg:grid-cols-2">
          <div className="flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-border bg-zinc-100">
            {embedSrc ? (
              <iframe
                title={`${company.name} konumu`}
                src={embedSrc}
                className="h-full min-h-[360px] w-full flex-1 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm leading-6 text-muted">
                Harita, adres veya Google Haritalar bağlantısı yönetim panelinden eklendiğinde burada görünür.
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {details.length > 0 ? (
              <ul className="space-y-2 text-sm leading-6">
                {details.map((item) => (
                  <li key={item.label}>
                    <span className="font-semibold">{item.label}: </span>
                    {item.href ? (
                      <a href={item.href} className="underline-offset-2 hover:underline">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-muted">
                Telefon, e-posta ve adres yönetim panelinden girildiğinde burada listelenir.
              </p>
            )}
            <ContactForm idPrefix="reach-" />
          </div>
        </div>
      </div>
    </section>
  );
}
