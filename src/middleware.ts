import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define which paths are accessible by which roles
const roleRedirects: Record<string, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  INSTITUTE_OWNER: "/institute/dashboard",
  BRANCH_MANAGER: "/branch/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
  STUDENT: "/student/dashboard",
};

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/error",
  "/pricing",
  "/about",
  "/contact",
  "/register",
];

// API routes that are public
const publicApiRoutes = ["/api/auth", "/api/register", "/api/webhook"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect if the cookie header is too large to prevent 494 REQUEST_HEADER_TOO_LARGE on Vercel lambda gateway
  const cookieHeader = request.headers.get("cookie") || "";
  if (cookieHeader.length > 3000) {
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    const cookiesToClear = [
      "next-auth.session-token",
      "next-auth.session-token.0",
      "next-auth.session-token.1",
      "next-auth.session-token.2",
      "next-auth.session-token.3",
      "next-auth.session-token.4",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.session-token.0",
      "__Secure-next-auth.session-token.1",
      "__Secure-next-auth.session-token.2",
      "__Secure-next-auth.session-token.3",
      "__Secure-next-auth.session-token.4",
    ];
    for (const cookieName of cookiesToClear) {
      response.cookies.delete(cookieName);
      response.headers.append(
        "Set-Cookie",
        `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`
      );
    }
    return response;
  }

  // Allow public API routes
  if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-build-purposes-only",
  });

  // Not authenticated — redirect to login
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/auth/change-password") {
    return NextResponse.next();
  }

  // Force password change before accessing protected pages (API routes handle their own auth)
  if (
    token.mustChangePassword &&
    !pathname.startsWith("/api/") &&
    pathname !== "/auth/change-password"
  ) {
    return NextResponse.redirect(new URL("/auth/change-password", request.url));
  }

  const role = token.role as string;

  // Guard admin routes
  if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(roleRedirects[role] || "/auth/login", request.url));
  }

  // Guard institute owner routes
  if (pathname.startsWith("/institute") && !["SUPER_ADMIN", "INSTITUTE_OWNER"].includes(role)) {
    return NextResponse.redirect(new URL(roleRedirects[role] || "/auth/login", request.url));
  }

  // Guard branch routes
  if (
    pathname.startsWith("/branch") &&
    !["SUPER_ADMIN", "INSTITUTE_OWNER", "BRANCH_MANAGER"].includes(role)
  ) {
    return NextResponse.redirect(new URL(roleRedirects[role] || "/auth/login", request.url));
  }

  // Guard teacher routes
  if (
    pathname.startsWith("/teacher") &&
    !["SUPER_ADMIN", "INSTITUTE_OWNER", "BRANCH_MANAGER", "TEACHER"].includes(role)
  ) {
    return NextResponse.redirect(new URL(roleRedirects[role] || "/auth/login", request.url));
  }

  // Guard parent routes
  if (pathname.startsWith("/parent") && role !== "PARENT" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(roleRedirects[role] || "/auth/login", request.url));
  }

  // Guard student routes
  if (pathname.startsWith("/student") && role !== "STUDENT" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(roleRedirects[role] || "/auth/login", request.url));
  }

  // Redirect root /dashboard to role-specific dashboard
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(roleRedirects[role] || "/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|images|patterns).*)"],
};
