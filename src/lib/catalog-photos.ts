const photos: Record<string, string> = {
  "Kare profil": "/photos/kare.jpg",
  "kare-profil": "/photos/kare.jpg",
  "Dikdörtgen profil": "/photos/dikdortgen.jpg",
  "dikdortgen-profil": "/photos/dikdortgen.jpg",
  Köşebent: "/photos/kosebent.jpg",
  kosebent: "/photos/kosebent.jpg",
  Lama: "/photos/lama.jpg",
  lama: "/photos/lama.jpg",
  "Bağlantı plakası": "/photos/plaka.jpg",
  "kutu-profil": "/photos/kutu.jpg",
  kare: "/photos/kare.jpg",
  dikdortgen: "/photos/dikdortgen.jpg",
  kosebent: "/photos/kosebent.jpg",
  lama: "/photos/lama.jpg",
};

export function catalogPhoto(key: string | null | undefined): string | null {
  if (!key) return null;
  return photos[key] ?? null;
}
