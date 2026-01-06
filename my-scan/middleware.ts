// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const path = req.nextUrl.pathname;

    const isSetupPage = path.startsWith("/setup");
    const isLoginPage = path.startsWith("/login");
    const isDashboard = path.startsWith("/dashboard");
    const isApiRoute = path.startsWith("/api");
    const isHomePage = path === "/";

    // Allow API routes to pass through (they handle auth internally)
    if (isApiRoute) {
      return NextResponse.next();
    }

    // If user is not logged in
    if (!token) {
      // Allow access to login page and home page only
      if (isLoginPage || isHomePage) {
        return NextResponse.next();
      }
      // Redirect to login for ALL protected pages (including /setup)
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // If user is logged in
    if (token) {
      const isSetupComplete = (token as any).isSetupComplete;

      // If on login page and already logged in, redirect appropriately
      if (isLoginPage) {
        if (!isSetupComplete) {
          return NextResponse.redirect(new URL("/setup", req.url));
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // If setup not complete, redirect to setup (except if already on setup page)
      if (!isSetupComplete && !isSetupPage) {
        return NextResponse.redirect(new URL("/setup", req.url));
      }

      // If setup is complete and trying to access setup page, redirect to dashboard
      if (isSetupComplete && isSetupPage) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // If setup complete and on home page, redirect to dashboard
      if (isSetupComplete && isHomePage) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow public routes
        if (
          path === "/" ||
          path.startsWith("/login") ||
          path.startsWith("/api")
        ) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
