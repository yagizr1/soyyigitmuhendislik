"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveHome } from "@/actions/content";
import { Button } from "@/components/ui/button";
import type { HomeSettings } from "@/lib/defaults";

export function HomeForm({ initial }: { initial: HomeSettings }) {
  const [home, setHome] = useState(initial);
  const [stats, setStats] = useState(initial.stats.items.map((item) => `${item.value} | ${item.label}`).join("\n"));

  return (
    <form
      className="grid max-w-3xl gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const next: HomeSettings = {
          ...home,
          stats: {
            ...home.stats,
            items: stats
              .split("\n")
              .map((line) => {
                const [value, ...rest] = line.split("|");
                return { value: value?.trim() ?? "", label: rest.join("|").trim() };
              })
              .filter((item) => item.value && item.label),
          },
        };
        const result = await saveHome(next);
        if (!result.ok) toast.error(result.message);
        else toast.success("Ana sayfa kaydedildi.");
      }}
    >
      <Section title="Karşılama" enabled={home.hero.enabled} onToggle={(enabled) => setHome({ ...home, hero: { ...home.hero, enabled } })}>
        <input className="h-11 rounded-md border px-3" value={home.hero.eyebrow} onChange={(event) => setHome({ ...home, hero: { ...home.hero, eyebrow: event.target.value } })} />
        <input className="h-11 rounded-md border px-3" value={home.hero.title} onChange={(event) => setHome({ ...home, hero: { ...home.hero, title: event.target.value } })} />
        <textarea className="min-h-24 rounded-md border px-3 py-2" value={home.hero.subtitle} onChange={(event) => setHome({ ...home, hero: { ...home.hero, subtitle: event.target.value } })} />
        <input className="h-11 rounded-md border px-3" placeholder="Görsel kayıt numarası" value={home.hero.imageMediaId} onChange={(event) => setHome({ ...home, hero: { ...home.hero, imageMediaId: event.target.value } })} />
        <input className="h-11 rounded-md border px-3" placeholder="Görsel alternatif metni" value={home.hero.imageAlt} onChange={(event) => setHome({ ...home, hero: { ...home.hero, imageAlt: event.target.value } })} />
        <input className="h-11 rounded-md border px-3" value={home.hero.primaryCta.label} onChange={(event) => setHome({ ...home, hero: { ...home.hero, primaryCta: { ...home.hero.primaryCta, label: event.target.value } } })} />
        <input className="h-11 rounded-md border px-3" value={home.hero.primaryCta.href} onChange={(event) => setHome({ ...home, hero: { ...home.hero, primaryCta: { ...home.hero.primaryCta, href: event.target.value } } })} />
        <input className="h-11 rounded-md border px-3" value={home.hero.secondaryCta.label} onChange={(event) => setHome({ ...home, hero: { ...home.hero, secondaryCta: { ...home.hero.secondaryCta, label: event.target.value } } })} />
        <input className="h-11 rounded-md border px-3" value={home.hero.secondaryCta.href} onChange={(event) => setHome({ ...home, hero: { ...home.hero, secondaryCta: { ...home.hero.secondaryCta, href: event.target.value } } })} />
      </Section>
      <Section title="Tanıtım" enabled={home.intro.enabled} onToggle={(enabled) => setHome({ ...home, intro: { ...home.intro, enabled } })}>
        <input className="h-11 rounded-md border px-3" value={home.intro.title} onChange={(event) => setHome({ ...home, intro: { ...home.intro, title: event.target.value } })} />
        <textarea className="min-h-24 rounded-md border px-3 py-2" value={home.intro.body} onChange={(event) => setHome({ ...home, intro: { ...home.intro, body: event.target.value } })} />
      </Section>
      <Section title="Öne çıkanlar" enabled={home.featured.enabled} onToggle={(enabled) => setHome({ ...home, featured: { ...home.featured, enabled } })}>
        <input className="h-11 rounded-md border px-3" value={home.featured.title} onChange={(event) => setHome({ ...home, featured: { ...home.featured, title: event.target.value } })} />
        <input className="h-11 rounded-md border px-3" value={home.featured.subtitle} onChange={(event) => setHome({ ...home, featured: { ...home.featured, subtitle: event.target.value } })} />
      </Section>
      <Section title="Rakamlar" enabled={home.stats.enabled} onToggle={(enabled) => setHome({ ...home, stats: { ...home.stats, enabled } })}>
        <textarea className="min-h-24 rounded-md border px-3 py-2" value={stats} onChange={(event) => setStats(event.target.value)} />
        <p className="text-xs text-muted">Yalnızca doğrulanmış rakam yazın. Her satır: değer | etiket. Ölçülmeyen istatistik eklemeyin.</p>
      </Section>
      <Section title="SSS" enabled={home.faq.enabled} onToggle={(enabled) => setHome({ ...home, faq: { ...home.faq, enabled } })}>
        <input className="h-11 rounded-md border px-3" value={home.faq.title} onChange={(event) => setHome({ ...home, faq: { ...home.faq, title: event.target.value } })} />
      </Section>
      <Section title="İletişim bandı" enabled={home.contact.enabled} onToggle={(enabled) => setHome({ ...home, contact: { ...home.contact, enabled } })}>
        <input className="h-11 rounded-md border px-3" value={home.contact.title} onChange={(event) => setHome({ ...home, contact: { ...home.contact, title: event.target.value } })} />
        <input className="h-11 rounded-md border px-3" value={home.contact.subtitle} onChange={(event) => setHome({ ...home, contact: { ...home.contact, subtitle: event.target.value } })} />
      </Section>
      <Section title="Çağrı" enabled={home.cta.enabled} onToggle={(enabled) => setHome({ ...home, cta: { ...home.cta, enabled } })}>
        <input className="h-11 rounded-md border px-3" value={home.cta.title} onChange={(event) => setHome({ ...home, cta: { ...home.cta, title: event.target.value } })} />
        <textarea className="min-h-20 rounded-md border px-3 py-2" value={home.cta.body} onChange={(event) => setHome({ ...home, cta: { ...home.cta, body: event.target.value } })} />
      </Section>
      <Button type="submit">Ana sayfayı kaydet</Button>
    </form>
  );
}

function Section({
  title,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-2 rounded-lg border border-border bg-card p-4">
      <legend className="px-1 font-semibold">{title}</legend>
      <label className="text-sm">
        <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} /> Bölümü göster
      </label>
      {children}
    </fieldset>
  );
}
