/**
 * 初回用：パスワード付きユーザーを 1 件作成する。
 * 実行: npm run db:seed（ローカル） / npm run db:seed:railway（本番＝Railway 経由）
 * 環境変数: DATABASE_URL, SEED_EMAIL, SEED_PASSWORD, SEED_ROLE (optional, default: participant)
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// 常に .env.local / .env を読む（override: false なので既存の env は上書きしない）。
// railway run で DATABASE_URL が渡っている場合はそのまま。SEED_* は .env.local に書いてよい。
config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

// .env.local の postgres.railway.internal は Railway 内でしか届かない。
// Railway 上（pre-deploy 等）では RAILWAY_ENVIRONMENT が立つのでそのまま接続する。
// ローカルで railway.internal が渡っている場合は接続できないので案内して終了。
if (
  process.env.DATABASE_URL?.includes("railway.internal") &&
  !process.env.RAILWAY_ENVIRONMENT
) {
  console.error(
    "DATABASE_URL が postgres.railway.internal のため、このマシンからは接続できません。",
  );
  console.error("本番用にシードする場合は、Cursor のターミナルで:");
  console.error("  npm run db:seed:railway");
  console.error("を実行するか、Railway の pre-deploy でシードを実行してください。");
  process.exit(1);
}

import bcrypt from "bcrypt";

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
