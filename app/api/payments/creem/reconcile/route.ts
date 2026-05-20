import { NextRequest, NextResponse } from "next/server";

import { subscriptionPlans } from "@/constants/billing";
import { getActiveSessionUser } from "@/lib/auth/session";
import { getErrorMessage } from "@/lib/error-utils";
import { fulfillCreemPayment } from "@/lib/payments/creem-fulfillment";
import {
  findBillingSelectionByProductId,
  parseCreemDateValue,
  parseCreemRequestId,
  verifyCreemRedirectSignature,
} from "@/lib/payments/creem-webhook";

type ReconcileBody = {
  checkout_id?: string;
  order_id?: string;
  customer_id?: string;
  subscription_id?: string;
  product_id?: string;
  request_id?: string;
  signature?: string;
};

type CreemCheckoutRecord = {
  id?: string;
  status?: string;
  product?: string | { id?: string };
  request_id?: string;
  metadata?: {
    userId?: string;
    referenceId?: string;
    key?: string;
    kind?: "subscription" | "one_time";
  };
  order?: {
    id?: string;
    product?: string;
    amount?: number;
    currency?: string;
    status?: string;
    transaction?: string;
  };
  subscription?: string | { id?: string; current_period_end_date?: string };
};

function getProductId(value: CreemCheckoutRecord["product"]) {
  return typeof value === "string" ? value : value?.id;
}

function getSubscriptionId(value: CreemCheckoutRecord["subscription"]) {
  return typeof value === "string" ? value : value?.id;
}

function getCurrentPeriodEnd(value: CreemCheckoutRecord["subscription"]) {
  if (typeof value === "string") return null;
  return parseCreemDateValue(value?.current_period_end_date);
}

async function fetchCreemCheckout(checkoutId: string) {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    throw new Error("CREEM_API_KEY is not configured");
  }

  const base = process.env.CREEM_API_BASE || "https://api.creem.io";
  const url = new URL("/v1/checkouts", base);
  url.searchParams.set("checkout_id", checkoutId);

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Creem checkout lookup failed: ${response.status}`);
  }

  return (await response.json()) as CreemCheckoutRecord;
}

export async function POST(req: NextRequest) {
  try {
    const access = await getActiveSessionUser(req.headers);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const apiKey = process.env.CREEM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CREEM_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ReconcileBody;
    if (!body.checkout_id || !body.product_id || !body.signature) {
      return NextResponse.json({ error: "Missing Creem redirect fields" }, { status: 400 });
    }

    const validSignature = await verifyCreemRedirectSignature(body, apiKey);
    if (!validSignature) {
      return NextResponse.json({ error: "Invalid Creem redirect signature" }, { status: 400 });
    }

    const checkout = await fetchCreemCheckout(body.checkout_id);
    if (checkout.status !== "completed") {
      return NextResponse.json({ received: true, status: checkout.status ?? "unknown" });
    }

    const requestId =
      checkout.request_id ?? checkout.metadata?.referenceId ?? checkout.metadata?.userId ?? body.request_id;
    const parsedRequestId = parseCreemRequestId(requestId);
    const metadataUserId = checkout.metadata?.userId ?? checkout.metadata?.referenceId;
    const expectedUserId = parsedRequestId?.userId ?? metadataUserId;

    if (expectedUserId !== access.user.id) {
      return NextResponse.json({ error: "Checkout does not belong to this user" }, { status: 403 });
    }

    const productId = getProductId(checkout.product) ?? checkout.order?.product ?? body.product_id;
    const billingSelection =
      findBillingSelectionByProductId(productId) ??
      (checkout.metadata?.key && checkout.metadata?.kind
        ? {
            key: checkout.metadata.key,
            kind: checkout.metadata.kind,
          }
        : null);

    if (!billingSelection) {
      return NextResponse.json({ error: "Unknown Creem product" }, { status: 400 });
    }

    const paymentId =
      checkout.order?.transaction ?? checkout.order?.id ?? body.order_id ?? checkout.id ?? body.checkout_id;
    const subscriptionId =
      getSubscriptionId(checkout.subscription) ?? body.subscription_id ?? null;
    const currentPeriodEnd =
      getCurrentPeriodEnd(checkout.subscription) ??
      (billingSelection.kind === "subscription"
        ? (() => {
            const cycle = subscriptionPlans[billingSelection.key as keyof typeof subscriptionPlans]?.cycle;
            const date = new Date();
            if (cycle === "year") date.setFullYear(date.getFullYear() + 1);
            else date.setMonth(date.getMonth() + 1);
            return date;
          })()
        : null);

    const fulfillment = await fulfillCreemPayment({
      paymentId,
      userId: access.user.id,
      key: billingSelection.key,
      kind: billingSelection.kind,
      amountCents: checkout.order?.amount ?? 0,
      currency: checkout.order?.currency ?? "USD",
      subscriptionId,
      currentPeriodEnd,
      raw: {
        source: "redirect_reconcile",
        redirect: body,
        checkout,
      },
    });

    return NextResponse.json({
      received: true,
      fulfilled: fulfillment.fulfilled,
      creditsGranted: fulfillment.creditsGranted ?? 0,
      planKey: fulfillment.planKey ?? billingSelection.key,
    });
  } catch (error: unknown) {
    console.error("[Creem Reconcile] Failed:", getErrorMessage(error, "Unknown error"));
    return NextResponse.json({ error: "Reconcile failed" }, { status: 500 });
  }
}
