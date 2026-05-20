import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";

import {
  isPackKey,
  isSubscriptionKey,
  oneTimePacks,
  subscriptionPlans,
  type PlanKey,
} from "@/constants/billing";
import {
  computeInitialGrant,
  deleteSubscriptionSchedule,
  getGrantSchedule,
  resetSubscriptionSchedule,
} from "@/lib/billing/subscription";
import { db } from "@/lib/db";
import {
  creditLedger,
  payment as paymentTable,
  subscription as subscriptionTable,
  user as userTable,
} from "@/lib/db/schema";

type CreemFulfillmentInput = {
  paymentId: string;
  userId: string;
  key: string;
  kind: "subscription" | "one_time";
  amountCents: number;
  currency: string;
  subscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
  raw: unknown;
};

export async function fulfillCreemPayment(input: CreemFulfillmentInput) {
  const existing = await db
    .select({ id: paymentTable.id })
    .from(paymentTable)
    .where(eq(paymentTable.providerPaymentId, input.paymentId))
    .limit(1);

  if (existing.length > 0) {
    return { fulfilled: false, reason: "already_processed" as const };
  }

  let creditsToGrant = 0;
  let planKey: PlanKey | null = null;
  const paymentType = input.kind;
  let scheduleResetContext: {
    subscriptionId: string;
    schedule: NonNullable<ReturnType<typeof getGrantSchedule>>;
    grantsRemaining: number;
    totalCreditsRemaining: number;
    nextGrantAt: Date | null;
  } | null = null;

  if (input.kind === "one_time" && isPackKey(input.key)) {
    creditsToGrant = oneTimePacks[input.key].credits;
  } else if (input.kind === "subscription" && isSubscriptionKey(input.key)) {
    planKey = input.key;
    const plan = subscriptionPlans[input.key];
    const schedule = getGrantSchedule(input.key);

    if (schedule && input.subscriptionId) {
      const initialGrant = computeInitialGrant(schedule);
      creditsToGrant = initialGrant.creditsNow;
      scheduleResetContext = {
        subscriptionId: input.subscriptionId,
        schedule,
        grantsRemaining: initialGrant.grantsRemaining,
        totalCreditsRemaining: initialGrant.totalCreditsRemaining,
        nextGrantAt: initialGrant.nextGrantAt,
      };
    } else {
      creditsToGrant = plan.creditsPerCycle;
    }
  } else {
    throw new Error("Invalid billing key");
  }

  await db.insert(paymentTable).values({
    id: input.paymentId,
    provider: "creem",
    providerPaymentId: input.paymentId,
    userId: input.userId,
    amountCents: input.amountCents,
    currency: input.currency.toLowerCase(),
    status: "succeeded",
    type: paymentType,
    planKey: planKey ?? undefined,
    creditsGranted: creditsToGrant,
    raw: JSON.stringify(input.raw).slice(0, 65000),
  });

  if (input.kind === "subscription" && planKey && input.subscriptionId) {
    const subRows = await db
      .select({ id: subscriptionTable.id })
      .from(subscriptionTable)
      .where(eq(subscriptionTable.providerSubId, input.subscriptionId));

    if (subRows.length === 0) {
      await db.insert(subscriptionTable).values({
        id: input.subscriptionId,
        provider: "creem",
        providerSubId: input.subscriptionId,
        userId: input.userId,
        planKey,
        status: "active",
        currentPeriodEnd: input.currentPeriodEnd ?? null,
        raw: JSON.stringify(input.raw).slice(0, 65000),
      });
    } else {
      const updatePayload: Partial<typeof subscriptionTable.$inferInsert> = {
        status: "active",
        planKey,
      };

      if (input.currentPeriodEnd) {
        updatePayload.currentPeriodEnd = input.currentPeriodEnd;
      }

      await db
        .update(subscriptionTable)
        .set(updatePayload)
        .where(eq(subscriptionTable.providerSubId, input.subscriptionId));
    }
  }

  await db.transaction(async (tx) => {
    if (creditsToGrant > 0) {
      await tx
        .update(userTable)
        .set({ credits: sql`${userTable.credits} + ${creditsToGrant}` })
        .where(eq(userTable.id, input.userId));

      await tx.insert(creditLedger).values({
        id: input.paymentId || randomUUID(),
        userId: input.userId,
        delta: creditsToGrant,
        reason: paymentType === "one_time" ? "one_time_pack" : "subscription_cycle",
        paymentId: input.paymentId,
      });
    }

    if (planKey && input.kind === "subscription") {
      await tx
        .update(userTable)
        .set({ planKey })
        .where(eq(userTable.id, input.userId));
    }

    if (input.kind === "subscription" && input.subscriptionId) {
      if (scheduleResetContext) {
        await resetSubscriptionSchedule(
          {
            subscriptionId: scheduleResetContext.subscriptionId,
            userId: input.userId,
            derivedSchedule: scheduleResetContext.schedule,
            grantsRemaining: scheduleResetContext.grantsRemaining,
            totalCreditsRemaining: scheduleResetContext.totalCreditsRemaining,
            nextGrantAt: scheduleResetContext.nextGrantAt,
          },
          tx
        );
      } else {
        await deleteSubscriptionSchedule(input.subscriptionId, tx);
      }
    }
  });

  return {
    fulfilled: true,
    creditsGranted: creditsToGrant,
    planKey,
  };
}
