import { Prisma } from "@prisma/client";

export class UserFacingError extends Error {}

export function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function publicErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof UserFacingError) return error.message;
  if (error instanceof Error) {
    if (
      error.message.startsWith("Bu işlem") ||
      error.message.startsWith("Oturum") ||
      error.message.startsWith("Çok ") ||
      error.message.startsWith("Görsel") ||
      error.message.startsWith("Yalnızca") ||
      error.message.startsWith("AUTH_SECRET") ||
      error.message.startsWith("Dosya")
    ) {
      return error.message;
    }
  }
  return fallback;
}
