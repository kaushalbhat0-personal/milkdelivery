import "better-auth";

declare module "better-auth" {
  interface User {
    tenantId: string;
    role: "admin" | "driver";
    phone: string | null;
    deletedAt: Date | null;
  }
}
