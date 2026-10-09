import { prisma } from "../src/lib/prisma";
import { hashPassword, passwordIssues } from "../src/lib/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "Yönetici";
  const username = (process.env.ADMIN_USERNAME?.trim() || email?.split("@")[0] || "").toLowerCase();
  if (!email || !password || !username) {
    console.error("ADMIN_EMAIL ve ADMIN_PASSWORD ortam değişkenleri gerekli.");
    process.exit(1);
  }
  const issues = passwordIssues(password);
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exit(1);
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error("Bu e-posta zaten kayıtlı. Sıfırlamak için npm run admin:reset-password kullanın.");
    process.exit(1);
  }
  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) {
    console.error("Bu kullanıcı adı zaten kayıtlı.");
    process.exit(1);
  }
  await prisma.user.create({
    data: { username, email, name, passwordHash: await hashPassword(password), role: "ADMIN", active: true },
  });
  console.log("Yönetici hesabı oluşturuldu.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Hesap oluşturulamadı");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
