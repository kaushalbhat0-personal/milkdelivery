import { auth } from "@/lib/auth";
import { ROLES } from "@/config/roles";

const publicPaths = ["/login"];

const adminPaths = ["/dashboard", "/customers", "/drivers", "/routes"];
const driverPaths = ["/route"];

export async function proxy(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const { pathname } = new URL(request.url);

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    if (session) {
      const redirectTo = session.user.role === ROLES.ADMIN ? "/dashboard" : "/route";
      return Response.redirect(new URL(redirectTo, request.url));
    }
    return;
  }

  if (!session) {
    return Response.redirect(new URL("/login", request.url));
  }

  const isAdminRoute = adminPaths.some((p) => pathname.startsWith(p));
  const isDriverRoute = driverPaths.some((p) => pathname.startsWith(p));

  if (isAdminRoute && session.user.role !== ROLES.ADMIN) {
    return Response.redirect(new URL("/route", request.url));
  }

  if (isDriverRoute && session.user.role !== ROLES.DRIVER) {
    return Response.redirect(new URL("/dashboard", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
