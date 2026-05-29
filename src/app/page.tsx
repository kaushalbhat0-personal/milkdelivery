import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_ROUTES, type AppRole } from "@/config/roles";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const route = ROLE_ROUTES[session.user.role as AppRole] ?? "/login";
  redirect(route);
}
