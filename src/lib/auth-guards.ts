import { redirect } from "next/navigation";
import { ROLES, type AppRole } from "@/config/roles";

export type SessionUser = {
  id: string;
  role: AppRole;
  tenantId: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

export type Session = { user: SessionUser } | null;

export function requireRole(session: Session, role: AppRole): SessionUser {
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== role) {
    if (session.user.role === "admin") {
      redirect("/dashboard");
    }
    redirect("/route");
  }
  return session.user;
}

export function requireAdmin(session: Session): SessionUser {
  return requireRole(session, ROLES.ADMIN);
}

export function requireDriver(session: Session): SessionUser {
  return requireRole(session, ROLES.DRIVER);
}
