import { statSync } from "node:fs";
import type { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

const files = [
  { key: "catalog/hero.jpg", url: "/photos/hero.jpg", alt: "Çelik profil kesimi", file: "public/photos/hero.jpg" },
  { key: "catalog/kare.jpg", url: "/photos/kare.jpg", alt: "Kare çelik profil", file: "public/photos/kare.jpg" },
  { key: "catalog/dikdortgen.jpg", url: "/photos/dikdortgen.jpg", alt: "Dikdörtgen çelik profil", file: "public/photos/dikdortgen.jpg" },
  { key: "catalog/kosebent.jpg", url: "/photos/kosebent.jpg", alt: "Köşebent", file: "public/photos/kosebent.jpg" },
  { key: "catalog/lama.jpg", url: "/photos/lama.jpg", alt: "Lama demir", file: "public/photos/lama.jpg" },
  { key: "catalog/plaka.jpg", url: "/photos/plaka.jpg", alt: "Çelik sac ve plaka", file: "public/photos/plaka.jpg" },
  { key: "catalog/kutu.jpg", url: "/photos/kutu.jpg", alt: "Kutu profil deposu", file: "public/photos/kutu.jpg" },
];

const slugKey: Record<string, string> = {
  "kutu-profil": "catalog/kutu.jpg",
  "kare-profil": "catalog/kare.jpg",
  "dikdortgen-profil": "catalog/dikdortgen.jpg",
  kosebent: "catalog/kosebent.jpg",
  lama: "catalog/lama.jpg",
};

const typeKey: Record<string, string> = {
  "Kare profil": "catalog/kare.jpg",
  "Dikdörtgen profil": "catalog/dikdortgen.jpg",
  Köşebent: "catalog/kosebent.jpg",
  Lama: "catalog/lama.jpg",
  "Bağlantı plakası": "catalog/plaka.jpg",
};

async function main() {
  const mediaByKey = new Map<string, string>();
  for (const file of files) {
    const size = statSync(file.file).size;
    const name = file.url.split("/").pop() ?? "gorsel.jpg";
    const media = await prisma.media.upsert({
      where: { storageKey: file.key },
      update: { url: file.url, alt: file.alt, size, mimeType: "image/jpeg", filename: name, originalName: name },
      create: {
        storageKey: file.key,
        url: file.url,
        alt: file.alt,
        size,
        mimeType: "image/jpeg",
        filename: name,
        originalName: name,
      },
    });
    mediaByKey.set(file.key, media.id);
  }

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  for (const category of categories) {
    const key = slugKey[category.slug];
    const imageId = key ? mediaByKey.get(key) : undefined;
    if (!imageId) continue;
    await prisma.category.update({ where: { id: category.id }, data: { imageId } });
  }

  const products = await prisma.product.findMany({
    select: { id: true, name: true, profileType: true, images: { select: { id: true } } },
  });
  let attached = 0;
  for (const product of products) {
    if (product.images.length > 0) continue;
    const key = typeKey[product.profileType ?? ""];
    const mediaId = key ? mediaByKey.get(key) : undefined;
    if (!mediaId) continue;
    await prisma.productImage.create({
      data: { productId: product.id, mediaId, alt: product.name, sortOrder: 0 },
    });
    attached += 1;
  }

  const home = await prisma.siteSetting.findUnique({ where: { key: "homepage" } });
  if (home?.value && typeof home.value === "object" && !Array.isArray(home.value)) {
    const value = structuredClone(home.value) as { hero?: { imageMediaId?: string; imageAlt?: string } };
    if (value.hero) {
      value.hero.imageMediaId = mediaByKey.get("catalog/hero.jpg") ?? "";
      if (!value.hero.imageAlt?.trim()) value.hero.imageAlt = "Çelik profil kesimi";
      await prisma.siteSetting.update({
        where: { key: "homepage" },
        data: { value: value as Prisma.InputJsonValue },
      });
    }
  }

  console.log(JSON.stringify({ media: mediaByKey.size, categories: categories.length, attached }));
  await prisma.$disconnect();
}

main();
