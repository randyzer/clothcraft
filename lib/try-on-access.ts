import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  generationHistory,
  subscription as subscriptionTable,
  user as userTable,
} from "@/lib/db/schema";
import { getTryOnLimits, type TryOnTier } from "@/lib/try-on";

const SHANGHAI_UTC_OFFSET_HOURS = 8;

export type TryOnEntitlement = {
  tier: TryOnTier;
  dailyLimit: number;
  garmentLimit: number;
  watermark: boolean;
};

export function resolveTryOnEntitlement({
  userPlanKey,
  activeSubscriptionPlanKey,
}: {
  userPlanKey?: string | null;
  activeSubscriptionPlanKey?: string | null;
}): TryOnEntitlement {
  const tier: TryOnTier =
    activeSubscriptionPlanKey && activeSubscriptionPlanKey !== "free"
      ? "paid"
      : userPlanKey && userPlanKey !== "free"
        ? "paid"
        : "free";
  const limits = getTryOnLimits(tier);

  return {
    tier,
    dailyLimit: limits.dailyGenerations,
    garmentLimit: limits.garmentLimit,
    watermark: limits.watermark,
  };
}

export function getShanghaiDayWindow(now = new Date()): { start: Date; end: Date } {
  const shifted = new Date(now.getTime() + SHANGHAI_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const startUtcMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  );
  const start = new Date(startUtcMs - SHANGHAI_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

export async function getTryOnEntitlement(userId: string): Promise<TryOnEntitlement> {
  const users = await db
    .select({ planKey: userTable.planKey })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  const activeSubscriptions = await db
    .select({ planKey: subscriptionTable.planKey })
    .from(subscriptionTable)
    .where(
      and(
        eq(subscriptionTable.userId, userId),
        eq(subscriptionTable.status, "active")
      )
    )
    .orderBy(desc(subscriptionTable.updatedAt))
    .limit(1);

  return resolveTryOnEntitlement({
    userPlanKey: users[0]?.planKey,
    activeSubscriptionPlanKey: activeSubscriptions[0]?.planKey,
  });
}

export async function countTryOnsInWindow(
  userId: string,
  window: { start: Date; end: Date }
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(generationHistory)
    .where(
      and(
        eq(generationHistory.userId, userId),
        eq(generationHistory.type, "try_on"),
        inArray(generationHistory.status, ["processing", "completed"]),
        gte(generationHistory.createdAt, window.start),
        lt(generationHistory.createdAt, window.end)
      )
    );

  return Number(rows[0]?.count ?? 0);
}
