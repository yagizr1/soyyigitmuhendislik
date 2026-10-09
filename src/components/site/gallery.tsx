"use client";

import { useState } from "react";
import { ProfileArt } from "@/components/site/profile-art";
import { SafeImage } from "@/components/site/safe-image";
import { catalogPhoto } from "@/lib/catalog-photos";

export function Gallery({
  images,
  shape,
}: {
  images: { url: string; alt: string }[];
  shape?: string | null;
}) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  const fallback = catalogPhoto(shape);
  if (!current && fallback) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
        <SafeImage src={fallback} alt="" sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
    );
  }
  if (!current) return <ProfileArt shape={shape} className="aspect-square w-full rounded-lg" />;
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
        <SafeImage src={current.url} alt={current.alt} priority={index === 0} sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, imageIndex) => (
            <button
              key={`${image.url}-${imageIndex}`}
              type="button"
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border"
              aria-label={`${imageIndex + 1}. görsel`}
              aria-current={imageIndex === index}
              onClick={() => setIndex(imageIndex)}
            >
              <SafeImage src={image.url} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
