export type CustomerPlan = {
  id: string;
  deliveryType: string;
  quantity: string | null;
  unit: string | null;
  deliveryDays: string[] | null;
  pauseFrom: string | null;
  pauseUntil: string | null;
  createdAt: Date;
};
