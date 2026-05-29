export const ROLES = {
  ADMIN: "admin",
  DRIVER: "driver",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  [ROLES.ADMIN]: 100,
  [ROLES.DRIVER]: 10,
};

export const ROLE_ROUTES: Record<AppRole, string> = {
  [ROLES.ADMIN]: "/dashboard",
  [ROLES.DRIVER]: "/route",
};

export function hasPermission(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
