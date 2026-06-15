/**
 * 初回用：パスワード付きユーザーを 1 件作成する。
 * 実行: npm run db:seed
 * 環境変数: DATABASE_URL（または DIRECT_URL）, SEED_EMAIL, SEED_PASSWORD, SEED_ROLE (optional, default: participant)
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

// 常に .env.local / .env を読む（override: false なので既存の env は上書きしない）。
config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const prisma = new PrismaClient();

const VALID_ROLES = ["admin", "facilitator", "participant"] as const;
type UserRole = (typeof VALID_ROLES)[number];

function normalizeRole(raw: string | undefined): UserRole {
  const s = (raw ?? "participant").trim().replace(/^`|`$/g, "");
  return VALID_ROLES.includes(s as UserRole) ? (s as UserRole) : "participant";
}

async function main() {
  const email = (process.env.SEED_EMAIL ?? "participant@example.third-age.local").trim();
  const password = process.env.SEED_PASSWORD ?? "password123";
  const role = normalizeRole(process.env.SEED_ROLE);

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
