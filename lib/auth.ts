import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-to-random-secret-in-production"
);
const COOKIE_NAME = "session";
const MAX_AGE_DAYS = 30; // 30 ngày

export type SessionPayload = { userId: string; email: string; name: string; isAdmin: boolean };

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${MAX_AGE_DAYS}d`)
    .sign(SECRET);

  const expires = new Date(Date.now() + MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function getSessionFromRequest(cookieHeader: string | null): Promise<SessionPayload | null> {
  if (!cookieHeader) return Promise.resolve(null);
  const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (!match) return Promise.resolve(null);
  return jwtVerify(match[1], SECRET)
    .then(({ payload }) => payload as unknown as SessionPayload)
    .catch(() => null);
}
