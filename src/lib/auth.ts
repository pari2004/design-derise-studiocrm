import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SessionUser } from "@/lib/roles";

export type { SessionUser } from "@/lib/roles";
export { ROLE_LABELS, can } from "@/lib/roles";

const COOKIE_NAME = "dds_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dds_studio_dev_secret_change_me_please_32chars_min",
);

export type SessionPayload = { user: SessionUser };

/* ----------------------------- passwords ----------------------------- */
export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/* ------------------------------ tokens ------------------------------- */
export async function createToken(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/* ------------------------------ session ------------------------------ */
export async function createSession(user: SessionUser) {
  const token = await createToken({ user });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Cached per-request so repeated calls in a render don't re-verify. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.user ?? null;
});

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  // Re-fetch to keep role/avatar fresh.
  const row = await db.query.users.findFirst({
    where: eq(users.id, session.id),
  });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatarUrl,
    title: row.title,
  };
}

export async function authenticate(email: string, password: string) {
  const row = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
  if (!row) return null;
  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) return null;
  const user: SessionUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatarUrl,
    title: row.title,
  };
  await createSession(user);
  return user;
}
