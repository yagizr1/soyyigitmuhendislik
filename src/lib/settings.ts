import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  defaultBrand,
  defaultCompany,
  defaultHome,
  defaultSocial,
  type BrandSettings,
  type CompanySettings,
  type HomeSettings,
  type SocialSettings,
} from "@/lib/defaults";
import { brandSchema, companySchema, homeSchema, socialSchema } from "@/lib/validators";

async function readObject(key: string): Promise<Record<string, unknown>> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  const value = row?.value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export const getCompany = cache(async (): Promise<CompanySettings> => {
  const parsed = companySchema.safeParse({ ...defaultCompany, ...(await readObject("company")) });
  return parsed.success ? { ...defaultCompany, ...parsed.data } : defaultCompany;
});

export const getSocial = cache(async (): Promise<SocialSettings> => {
  const parsed = socialSchema.safeParse({ ...defaultSocial, ...(await readObject("social")) });
  return parsed.success ? { ...defaultSocial, ...parsed.data } : defaultSocial;
});

export const getBrand = cache(async (): Promise<BrandSettings> => {
  const parsed = brandSchema.safeParse({ ...defaultBrand, ...(await readObject("brand")) });
  if (!parsed.success) return defaultBrand;
  return {
    accent: parsed.data.accent,
    logoMediaId: parsed.data.logoMediaId ?? "",
    faviconMediaId: parsed.data.faviconMediaId ?? "",
  };
});

export const getHome = cache(async (): Promise<HomeSettings> => {
  const parsed = homeSchema.safeParse(await readObject("homepage"));
  return parsed.success ? parsed.data : defaultHome;
});

export async function mediaUrl(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const media = await prisma.media.findUnique({ where: { id }, select: { url: true, alt: true } });
  return media?.url ?? null;
}

export async function getBrandAssets(): Promise<{
  brand: BrandSettings;
  logoUrl: string | null;
  faviconUrl: string | null;
}> {
  const brand = await getBrand();
  const [logo, favicon] = await Promise.all([
    brand.logoMediaId
      ? prisma.media.findUnique({ where: { id: brand.logoMediaId }, select: { url: true } })
      : null,
    brand.faviconMediaId
      ? prisma.media.findUnique({ where: { id: brand.faviconMediaId }, select: { url: true } })
      : null,
  ]);
  return { brand, logoUrl: logo?.url ?? null, faviconUrl: favicon?.url ?? null };
}
