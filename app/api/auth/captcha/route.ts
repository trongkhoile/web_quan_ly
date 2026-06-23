import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-to-random-secret-in-production"
);

export async function GET() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const answer = a + b;

  // Token hết hạn sau 10 phút
  const token = await new SignJWT({ answer })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(SECRET);

  return NextResponse.json({ question: `${a} + ${b} = ?`, token });
}
