import bcrypt from "bcrypt";
import * as jose from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "third_age_session";
const SALT_ROUNDS = 10;

function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? "dev-secret-change-in-production";
}

export type UserRole = "admin" | "facilitator" | "participant";

export type SessionPayload = {
  sub: string; // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function getSecretKey(): Uint8Array {
  const secret = getJwtSecret();
  if (secret.length < 32) {
    throw new Error(
      `JWT_SECRET must be at least 32 characters (got ${secret.length}). Check Railway Variables: name must be exactly JWT_SECRET.`
    );
  }
  return new TextEncoder().encode(secret.slice(0, 64));
}

export async function createToken(payload: SessionPayload): Promise<string> {
  const key = getSecretKey();
  return new jose.SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jose.jwtVerify(token, key);
    const sub = payload.sub;
    const email = payload.email as string;
    const role = payload.role as UserRole;
    if (!sub || !email || !role) return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 14, // 14日
    path: "/",
  };
}
