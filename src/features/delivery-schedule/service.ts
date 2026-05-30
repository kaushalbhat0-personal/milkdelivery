const WEEKDAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export type EligibilityResult = {
  eligible: boolean;
  reason?: string;
};

export function isEligible(
  plan: {
    deliveryType: string;
    quantity: string | null;
    unit: string | null;
    deliveryDays: string[] | null;
    pauseFrom: string | null;
    pauseUntil: string | null;
    deliveryStartDate: string | null;
  },
  today?: Date
): EligibilityResult {
  const date = today ?? new Date();
  const todayStr = date.toISOString().split("T")[0];
  const todayWeekday = WEEKDAY_NAMES[date.getDay()];

  switch (plan.deliveryType) {
    case "DAILY":
      return { eligible: true };

    case "ALTERNATE_DAYS": {
      if (!plan.deliveryStartDate) {
        return { eligible: false, reason: "No delivery start date configured" };
      }
      const start = new Date(plan.deliveryStartDate);
      start.setHours(0, 0, 0, 0);
      const todayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffMs = todayDate.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return { eligible: false, reason: "Delivery start date is in the future" };
      }
      const isEligible = diffDays % 2 === 0;
      return {
        eligible: isEligible,
        reason: isEligible ? undefined : "Alternate day off",
      };
    }

    case "CUSTOM_DAYS": {
      if (!plan.deliveryDays || plan.deliveryDays.length === 0) {
        return { eligible: false, reason: "No delivery days configured" };
      }
      const isSelected = plan.deliveryDays.includes(todayWeekday);
      return {
        eligible: isSelected,
        reason: isSelected ? undefined : `Not a delivery day (${todayWeekday})`,
      };
    }

    case "PAUSED": {
      if (plan.pauseFrom && plan.pauseUntil) {
        if (todayStr >= plan.pauseFrom && todayStr <= plan.pauseUntil) {
          return { eligible: false, reason: "Delivery paused" };
        }
      } else if (plan.pauseFrom && !plan.pauseUntil) {
        if (todayStr >= plan.pauseFrom) {
          return { eligible: false, reason: "Delivery paused" };
        }
      }
      return { eligible: true };
    }

    default:
      return { eligible: true };
  }
}

export function formatQuantity(quantity: string | null, unit: string | null): string {
  if (!quantity) return "—";
  const num = parseFloat(quantity);
  if (unit === "ML") {
    return `${num} ML`;
  }
  return num % 1 === 0 ? `${num} L` : `${num} L`;
}

export function normalizeQuantityToLiters(quantity: string | null, unit: string | null): number {
  if (!quantity) return 0;
  const num = parseFloat(quantity);
  if (unit === "ML") return num / 1000;
  return num;
}
