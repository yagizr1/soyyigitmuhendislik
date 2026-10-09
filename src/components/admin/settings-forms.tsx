"use client";

import { toast } from "sonner";
import { saveBrand, saveCompany, saveSocial } from "@/actions/settings";
import { uploadMedia } from "@/actions/media";
import { Button } from "@/components/ui/button";
import type { BrandSettings, CompanySettings, SocialSettings } from "@/lib/defaults";

export function SettingsForms({
  company,
  social,
  brand,
}: {
  company: CompanySettings;
  social: SocialSettings;
  brand: BrandSettings;
}) {
  return (
    <div className="grid max-w-3xl gap-8">
      <form
        className="grid gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await saveCompany({
            name: String(form.get("name") ?? ""),
            legalName: String(form.get("legalName") ?? ""),
            demo: company.demo,
            phone: String(form.get("phone") ?? ""),
            email: String(form.get("email") ?? ""),
            whatsapp: String(form.get("whatsapp") ?? ""),
            address: String(form.get("address") ?? ""),
            city: String(form.get("city") ?? ""),
            mapUrl: String(form.get("mapUrl") ?? ""),
            hours: String(form.get("hours") ?? ""),
            footerNote: String(form.get("footerNote") ?? ""),
          });
          toast[result.ok ? "success" : "error"](result.ok ? "Firma bilgileri kaydedildi." : result.message);
        }}
      >
        <h2 className="font-display text-2xl">Firma</h2>
        <input name="name" defaultValue={company.name} className="h-11 rounded-md border px-3" />
        <input name="legalName" defaultValue={company.legalName} placeholder="Yasal unvan" className="h-11 rounded-md border px-3" />
        <input name="phone" defaultValue={company.phone} placeholder="Telefon" className="h-11 rounded-md border px-3" />
        <input name="email" defaultValue={company.email} placeholder="E-posta" className="h-11 rounded-md border px-3" />
        <input name="whatsapp" defaultValue={company.whatsapp} placeholder="+90555..." className="h-11 rounded-md border px-3" />
        <textarea name="address" defaultValue={company.address} placeholder="Adres" className="min-h-20 rounded-md border px-3 py-2" />
        <input name="city" defaultValue={company.city} placeholder="Şehir" className="h-11 rounded-md border px-3" />
        <input name="mapUrl" defaultValue={company.mapUrl} placeholder="Google Haritalar bağlantısı" className="h-11 rounded-md border px-3" />
        <input name="hours" defaultValue={company.hours} placeholder="Çalışma saatleri" className="h-11 rounded-md border px-3" />
        <textarea name="footerNote" defaultValue={company.footerNote} className="min-h-20 rounded-md border px-3 py-2" />
        <Button type="submit">Firma bilgilerini kaydet</Button>
      </form>
      <form
        className="grid gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await saveSocial({
            linkedin: String(form.get("linkedin") ?? ""),
            instagram: String(form.get("instagram") ?? ""),
            facebook: String(form.get("facebook") ?? ""),
            youtube: String(form.get("youtube") ?? ""),
          });
          toast[result.ok ? "success" : "error"](result.ok ? "Sosyal bağlantılar kaydedildi." : result.message);
        }}
      >
        <h2 className="font-display text-2xl">Sosyal</h2>
        <input name="linkedin" defaultValue={social.linkedin} placeholder="LinkedIn" className="h-11 rounded-md border px-3" />
        <input name="instagram" defaultValue={social.instagram} placeholder="Instagram" className="h-11 rounded-md border px-3" />
        <input name="facebook" defaultValue={social.facebook} placeholder="Facebook" className="h-11 rounded-md border px-3" />
        <input name="youtube" defaultValue={social.youtube} placeholder="YouTube" className="h-11 rounded-md border px-3" />
        <Button type="submit" variant="outline">Sosyal bağlantıları kaydet</Button>
      </form>
      <form
        className="grid gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          let logoMediaId = brand.logoMediaId;
          let faviconMediaId = brand.faviconMediaId;
          const logo = form.get("logo");
          const favicon = form.get("favicon");
          if (logo instanceof File && logo.size > 0) {
            const data = new FormData();
            data.set("file", logo);
            data.set("alt", "Logo");
            const uploaded = await uploadMedia(data);
            if (!uploaded.ok) {
              toast.error(uploaded.message);
              return;
            }
            logoMediaId = uploaded.data.id;
          }
          if (favicon instanceof File && favicon.size > 0) {
            const data = new FormData();
            data.set("file", favicon);
            data.set("alt", "Favicon");
            const uploaded = await uploadMedia(data);
            if (!uploaded.ok) {
              toast.error(uploaded.message);
              return;
            }
            faviconMediaId = uploaded.data.id;
          }
          const result = await saveBrand({
            accent: String(form.get("accent") ?? brand.accent),
            logoMediaId,
            faviconMediaId,
          });
          toast[result.ok ? "success" : "error"](result.ok ? "Marka kaydedildi." : result.message);
        }}
      >
        <h2 className="font-display text-2xl">Marka</h2>
        <input name="accent" defaultValue={brand.accent} className="h-11 rounded-md border px-3" />
        <label className="text-sm">Logo<input name="logo" type="file" accept="image/jpeg,image/png,image/webp,image/avif" /></label>
        <label className="text-sm">Favicon<input name="favicon" type="file" accept="image/jpeg,image/png,image/webp,image/avif" /></label>
        <Button type="submit" variant="outline">Markayı kaydet</Button>
      </form>
    </div>
  );
}
