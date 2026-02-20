/**
 * 初回用：パスワード付きユーザーを 1 件作成する。
 * 実行: npx tsx prisma/seed.ts
 * 環境変数: DATABASE_URL, SEED_EMAIL, SEED_PASSWORD, SEED_ROLE (optional, default: participant)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email =
    process.env.SEED_EMAIL ?? "participant@example.third-age.local";
  const password = process.env.SEED_PASSWORD ?? "password123";
  const role = (process.env.SEED_ROLE ?? "participant") as
    | "admin"
    | "facilitator"
    | "participant";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("User already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, role },
  });
  console.log("Created user:", email, "role:", role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
