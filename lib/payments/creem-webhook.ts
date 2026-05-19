import {
  isPackKey,
  isSubscriptionKey,
  oneTimePacks,
  subscriptionPlans,
  type BillingKind,
} from "@/constants/billing";

type CreemEventLike = {
  id?: string;
  eventType?: string;
  object?: Record<string, unknown> | null;
};

type BillingSelection = {
  kind: BillingKind;
  key: string;
};

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function findBillingSelectionByProductId(
  productId?: string | null
): BillingSelection | null {
  if (!productId) {
    return null;
  }

  for (const [key, plan] of Object.entries(subscriptionPlans)) {
    if (plan.creemPriceId === productId && isSubscriptionKey(key)) {
      return { kind: "subscription", key };
    }
  }

  for (const [key, pack] of Object.entries(oneTimePacks)) {
    if (pack.creemPriceId === productId && isPackKey(key)) {
      return { kind: "one_time", key };
    }
  }

  return null;
}

export function getCreemEventProductId(event: CreemEventLike) {
  const object = getRecord(event.object);
  const product = getRecord(object?.product);
  const order = getRecord(object?.order);
  const orderProduct = getRecord(order?.product);
  const subscription = getRecord(object?.subscription);
  const subscriptionProduct = getRecord(subscription?.product);

  return (
    getString(product?.id) ??
    getString(object?.product) ??
    getString(orderProduct?.id) ??
    getString(order?.product) ??
    getString(subscriptionProduct?.id) ??
    getString(subscription?.product)
  );
}

export function getCreemEventPaymentId(event: CreemEventLike) {
  const object = getRecord(event.object);
  const order = getRecord(object?.order);
  const lastTransaction = getRecord(object?.last_transaction);

  if (event.eventType === "checkout.completed") {
    return getString(order?.id) ?? getString(object?.id) ?? event.id;
  }

  if (event.eventType?.startsWith("subscription.")) {
    return (
      getString(object?.last_transaction_id) ??
      getString(lastTransaction?.order) ??
      getString(lastTransaction?.id) ??
      event.id
    );
  }

  return event.id;
}

export function parseCreemDateValue(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const timestamp = value > 1e12 ? value : value * 1000;
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}
