import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_ROUTES, type AppRole } from "@/config/roles";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const route = ROLE_ROUTES[session.user.role as AppRole] ?? "/login";
  redirect(route);
}
