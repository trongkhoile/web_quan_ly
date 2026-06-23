import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-to-random-secret-in-production"
);

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/captcha",
];

const PROTECTED_PATHS = ["/dashboard", "/admin", "/api/accounts", "/api/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Trang công khai — không cần auth
  if (PUBLIC_PATHS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(p)))) {
    return NextResponse.next();
  }

  // Chỉ bảo vệ các path cụ thể
  const needsAuth = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, SECRET);

    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (!payload.isAdmin) return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
