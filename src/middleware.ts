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

  const role = token.role as string;

  // Force password change before accessing protected routes
  if (
    token.mustChangePassword &&
    pathname !== "/auth/change-password" &&
    !pathname.startsWith("/api/auth/change-password")
  ) {
    return NextResponse.redirect(new URL("/auth/change-password", request.url));
  }

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
