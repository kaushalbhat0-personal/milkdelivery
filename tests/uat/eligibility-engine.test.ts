/**
 * UAT: Eligibility Engine
 *
 * Tests the core business logic that determines whether a customer
 * receives milk today. This is the single source of truth used by:
 *   - Driver route filtering
 *   - Admin route summary
 *   - Route optimization
 *   - Delivery dashboard
 */

import { isEligible, formatQuantity, normalizeQuantityToLiters } from "../../src/features/delivery-schedule/service";

type Plan = Parameters<typeof isEligible>[0];

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    deliveryType: "DAILY",
    quantity: "1",
    unit: "LITER",
    deliveryDays: null,
    pauseFrom: null,
    pauseUntil: null,
    deliveryStartDate: null,
    ...overrides,
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

// ─── Workflow 1: DAILY ─────────────────────────────────────────────
console.log("\n── Workflow 1: DAILY (always eligible) ──");
{
  const plan = makePlan({ deliveryType: "DAILY" });
  const result = isEligible(plan);
  assert(result.eligible === true, "DAILY customer is always eligible");

  const weekend = new Date("2026-06-06"); // Saturday
  const resultSat = isEligible(plan, weekend);
  assert(resultSat.eligible === true, "DAILY customer eligible on Saturday");
}

// ─── Workflow 2: ALTERNATE_DAYS ─────────────────────────────────────
console.log("\n── Workflow 2: ALTERNATE_DAYS (eligible every other day) ──");
{
  const startDate = "2026-06-01"; // Monday
  const plan = makePlan({
    deliveryType: "ALTERNATE_DAYS",
    deliveryStartDate: startDate,
  });

  const day0 = new Date("2026-06-01"); // start date — eligible (diff=0, 0%2=0)
  assert(isEligible(plan, day0).eligible === true, "Start day is eligible");

  const day1 = new Date("2026-06-02"); // diff=1, 1%2=1
  assert(isEligible(plan, day1).eligible === false, "Next day is not eligible");

  const day2 = new Date("2026-06-03"); // diff=2, 2%2=0
  assert(isEligible(plan, day2).eligible === true, "Day 2 (alternate) is eligible");

  const day3 = new Date("2026-06-04"); // diff=3, 3%2=1
  assert(isEligible(plan, day3).eligible === false, "Day 3 is not eligible");
}

// ─── Workflow 2b: ALTERNATE_DAYS without start date ─────────────────
console.log("\n── Workflow 2b: ALTERNATE_DAYS without start date ──");
{
  const plan = makePlan({
    deliveryType: "ALTERNATE_DAYS",
    deliveryStartDate: null,
  });

  const result = isEligible(plan);
  assert(result.eligible === false, "ALTERNATE_DAYS without start date is not eligible");
  assert(result.reason === "No delivery start date configured", "Returns proper reason");
}

// ─── Workflow 2c: ALTERNATE_DAYS with future start date ─────────────
console.log("\n── Workflow 2c: ALTERNATE_DAYS with future start date ──");
{
  const plan = makePlan({
    deliveryType: "ALTERNATE_DAYS",
    deliveryStartDate: "2099-01-01",
  });

  const result = isEligible(plan);
  assert(result.eligible === false, "Future start date is not eligible");
}

// ─── Workflow 3: CUSTOM_DAYS ────────────────────────────────────────
console.log("\n── Workflow 3: CUSTOM_DAYS (selected weekdays only) ──");
{
  const plan = makePlan({
    deliveryType: "CUSTOM_DAYS",
    deliveryDays: ["MON", "WED", "FRI"],
  });

  const monday = new Date("2026-06-01"); // Monday
  assert(isEligible(plan, monday).eligible === true, "Monday is a delivery day");

  const tuesday = new Date("2026-06-02"); // Tuesday
  assert(isEligible(plan, tuesday).eligible === false, "Tuesday is not a delivery day");

  const wednesday = new Date("2026-06-03"); // Wednesday
  assert(isEligible(plan, wednesday).eligible === true, "Wednesday is a delivery day");

  const thursday = new Date("2026-06-04"); // Thursday
  assert(isEligible(plan, thursday).eligible === false, "Thursday is not a delivery day");

  const friday = new Date("2026-06-05"); // Friday
  assert(isEligible(plan, friday).eligible === true, "Friday is a delivery day");
}

// ─── Workflow 3b: CUSTOM_DAYS with no days selected ─────────────────
console.log("\n── Workflow 3b: CUSTOM_DAYS with empty days ──");
{
  const plan = makePlan({
    deliveryType: "CUSTOM_DAYS",
    deliveryDays: [],
  });

  const result = isEligible(plan);
  assert(result.eligible === false, "No delivery days configured");
}

// ─── Workflow 4: PAUSED ─────────────────────────────────────────────
console.log("\n── Workflow 4: PAUSED (vacation hold) ──");
{
  const plan = makePlan({
    deliveryType: "PAUSED",
    pauseFrom: "2026-06-01",
    pauseUntil: "2026-06-15",
  });

  const beforePause = new Date("2026-05-31");
  assert(isEligible(plan, beforePause).eligible === true, "Before pause is eligible");

  const duringPause = new Date("2026-06-07");
  assert(isEligible(plan, duringPause).eligible === false, "During pause is not eligible");

  const afterPause = new Date("2026-06-16");
  assert(isEligible(plan, afterPause).eligible === true, "After pause is eligible");
}

// ─── Workflow 4b: PAUSED without end date ────────────────────────────
console.log("\n── Workflow 4b: PAUSED without end date ──");
{
  const plan = makePlan({
    deliveryType: "PAUSED",
    pauseFrom: "2026-06-01",
    pauseUntil: null,
  });

  const beforePause = new Date("2026-05-31");
  assert(isEligible(plan, beforePause).eligible === true, "Before open-ended pause is eligible");

  const duringPause = new Date("2026-06-07");
  assert(isEligible(plan, duringPause).eligible === false, "During open-ended pause is not eligible");
}

// ─── Workflow 5: Quantity Formatting ──────────────────────────────────
console.log("\n── Workflow 5: Quantity Display ──");
{
  assert(formatQuantity("1", "LITER") === "1 L", "Formats 1 L");
  assert(formatQuantity("0.5", "LITER") === "0.5 L", "Formats 0.5 L");
  assert(formatQuantity("500", "ML") === "500 ML", "Formats 500 ML");
  assert(formatQuantity(null, "LITER") === "—", "Null quantity shows dash");
  assert(normalizeQuantityToLiters("1", "LITER") === 1, "1 L = 1 liter");
  assert(normalizeQuantityToLiters("500", "ML") === 0.5, "500 ML = 0.5 liter");
  assert(normalizeQuantityToLiters("2", "LITER") === 2, "2 L = 2 liters");
  assert(normalizeQuantityToLiters(null, "LITER") === 0, "Null quantity = 0");
}

// ─── Summary ───────────────────────────────────────────────────────────
console.log(`\n═══ RESULTS ═══`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  console.error("❌ Some UAT tests failed!");
  process.exit(1);
} else {
  console.log("✅ All UAT tests passed!");
}
