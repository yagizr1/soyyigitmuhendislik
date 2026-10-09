import { prisma } from "../src/lib/prisma";
import { hashPassword, passwordIssues } from "../src/lib/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !password) {
    console.error("ADMIN_EMAIL ve ADMIN_PASSWORD ortam değişkenleri gerekli.");
    process.exit(1);
  }
  const issues = passwordIssues(password);
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("Bu e-posta ile hesap yok.");
    process.exit(1);
  }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password), active: true } });
  await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
  console.log("Parola güncellendi.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Parola sıfırlanamadı");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
