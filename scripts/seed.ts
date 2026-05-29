import { db } from "../src/lib/db";
import { tenants } from "../src/lib/db/schema/tenants";
import { customers } from "../src/lib/db/schema/customers";
import { routes } from "../src/lib/db/schema/routes";
import { routeStops } from "../src/lib/db/schema/route-stops";
import { auth } from "../src/lib/auth";

async function seed() {
  console.log("Seeding database...");

  const [tenant] = await db
    .insert(tenants)
    .values({ name: "Demo Dairy", slug: "demo-dairy" })
    .returning();

  console.log("Created tenant:", tenant.name);

  const adminEmail = "admin@demo.com";
  const driverEmail = "driver@demo.com";
  const adminPassword = "admin123";
  const driverPassword = "driver123";

  await auth.api.signUpEmail({
    body: {
      email: adminEmail,
      password: adminPassword,
      name: "Admin User",
      tenantId: tenant.id,
      role: "admin",
    },
  });

  console.log("Created admin user");

  await auth.api.signUpEmail({
    body: {
      email: driverEmail,
      password: driverPassword,
      name: "Driver One",
      tenantId: tenant.id,
      role: "driver",
    },
  });

  console.log("Created driver user");

  const driverUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, driverEmail),
  });

  const customerData = [
    { name: "Sharma House", address: "123, Sector 5, Phase 1", landmark: "Near Water Tank", latitude: "18.5204", longitude: "73.8567" },
    { name: "Patel Residence", address: "456, Sector 5, Phase 2", landmark: "Opposite Park", latitude: "18.5210", longitude: "73.8570" },
    { name: "Verma Villa", address: "789, Sector 5, Phase 3", landmark: "Behind Temple", latitude: "18.5215", longitude: "73.8575" },
    { name: "Gupta House", address: "321, Sector 6, Phase 1", landmark: "Near School", latitude: "18.5220", longitude: "73.8580" },
    { name: "Joshi Bungalow", address: "654, Sector 6, Phase 2", landmark: "Next to Hospital", latitude: "18.5225", longitude: "73.8585" },
  ];

  const insertedCustomers = await db
    .insert(customers)
    .values(
      customerData.map((c) => ({
        ...c,
        tenantId: tenant.id,
      }))
    )
    .returning();

  console.log(`Created ${insertedCustomers.length} customers`);

  const [route] = await db
    .insert(routes)
    .values({
      name: "Route A",
      zone: "Sector 5 & 6",
      driverId: driverUser?.id,
      tenantId: tenant.id,
    })
    .returning();

  console.log("Created route:", route.name);

  const stops = insertedCustomers.map((customer, index) => ({
    routeId: route.id,
    customerId: customer.id,
    sortOrder: index + 1,
    tenantId: tenant.id,
  }));

  await db.insert(routeStops).values(stops);

  console.log(`Added ${stops.length} stops to route`);

  console.log("\nSeed completed!");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Driver: ${driverEmail} / ${driverPassword}`);
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
