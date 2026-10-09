import bcrypt from "bcryptjs";

const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "admin123",
  "admin12345",
  "123456789012",
  "qwerty12345",
  "sifre12345",
  "administrator",
  "changeme123",
]);

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 12) issues.push("Parola en az 12 karakter olmalı.");
  if (password.length > 128) issues.push("Parola en fazla 128 karakter olabilir.");
  if (!/[a-z]/.test(password)) issues.push("Parola en az bir küçük harf içermeli.");
  if (!/[A-Z]/.test(password)) issues.push("Parola en az bir büyük harf içermeli.");
  if (!/[0-9]/.test(password)) issues.push("Parola en az bir rakam içermeli.");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    issues.push("Bu parola çok yaygın. Daha zor tahmin edilen bir parola seçin.");
  }
  return issues;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
