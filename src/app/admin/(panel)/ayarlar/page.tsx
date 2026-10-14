import { SettingsForms } from "@/components/admin/settings-forms";
import { getBrand, getCompany, getSocial } from "@/lib/settings";

export default async function SettingsPage() {
  const [company, social, brand] = await Promise.all([getCompany(), getSocial(), getBrand()]);
  return (
    <div>
      <h1 className="font-display text-4xl">Ayarlar</h1>
      <p className="mt-2 text-sm text-muted">Telefon, adres ve WhatsApp boş bırakılabilir. WhatsApp numarası 05xx veya +90 ile yazılır.</p>
      <div className="mt-6">
        <SettingsForms company={company} social={social} brand={brand} />
      </div>
    </div>
  );
}
