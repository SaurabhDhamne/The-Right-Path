import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supabase stores the session token in a cookie that starts with "sb-"
  const hasSession = request.cookies
    .getAll()
    .some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );

  // Protect /dashboard — redirect unauthenticated users to /login
  if (pathname.startsWith("/dashboard") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If already logged in, skip the /login page and go back to homepage
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
