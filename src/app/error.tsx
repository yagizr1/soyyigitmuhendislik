"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-4 py-16">
      <h1 className="font-display text-4xl">Sayfa açılamadı</h1>
      <p className="mt-3 text-muted">İşlem sırasında bir sorun oluştu. Ayrıntı gösterilmiyor.</p>
      <button type="button" onClick={reset} className="mt-6 h-11 w-fit rounded-md bg-steel px-4 font-semibold text-white">
        Tekrar dene
      </button>
    </div>
  );
}
