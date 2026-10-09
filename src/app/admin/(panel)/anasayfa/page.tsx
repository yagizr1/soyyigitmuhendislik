import { HomeForm } from "@/components/admin/home-form";
import { getHome } from "@/lib/settings";

export default async function HomeAdminPage() {
  const home = await getHome();
  return (
    <div>
      <h1 className="font-display text-4xl">Ana sayfa</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">Her bölüm ayrı ayrı kapatılabilir. Rakam alanını yalnızca elinizde gerçek veri varsa açın.</p>
      <div className="mt-6">
        <HomeForm initial={home} />
      </div>
    </div>
  );
}
