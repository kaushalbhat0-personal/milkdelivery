import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const url = process.env.DATABASE_URL;
const sql = neon(url);

const allRoutes = await sql.query("SELECT id, name, tenant_id, driver_id, is_active, deleted_at FROM routes ORDER BY created_at DESC");
console.log("=== ALL ROUTES ===");
if (allRoutes.length === 0) {
  console.log("No routes found");
} else {
  allRoutes.forEach((r) => {
    console.log("  id:", r.id);
    console.log("  name:", r.name);
    console.log("  tenant_id:", r.tenant_id);
    console.log("  driver_id:", r.driver_id);
    console.log("  is_active:", r.is_active);
    console.log("  deleted_at:", r.deleted_at);
    console.log("---");
  });
}

const tenants = await sql.query("SELECT id, name FROM tenants");
console.log("\n=== TENANTS ===");
tenants.forEach((t) => console.log("  id:", t.id, "name:", t.name));

const admins = await sql.query("SELECT id, name, email, tenant_id, role FROM users WHERE role = 'admin'");
console.log("\n=== ADMIN USERS ===");
admins.forEach((u) => console.log("  id:", u.id, "name:", u.name, "tenant_id:", u.tenant_id));

if (admins.length > 0 && allRoutes.length > 0) {
  const admin = admins[0];
  const matchingRoutes = allRoutes.filter((r) => r.tenant_id === admin.tenant_id);
  console.log("\n=== ROUTES MATCHING ADMIN TENANT (" + admin.tenant_id + ") ===");
  console.log("  Matching:", matchingRoutes.length, "of", allRoutes.length, "total");

  if (matchingRoutes.length === 0 && allRoutes.length > 0) {
    console.log("\n  *** MISMATCH DETECTED");
    console.log("  Admin tenant_id:", admin.tenant_id);
    const uniqueTenantIds = [...new Set(allRoutes.map(r => r.tenant_id))];
    console.log("  Route tenant_ids:", uniqueTenantIds.join(", "));
  }
}
