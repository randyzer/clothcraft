import { and, eq } from "drizzle-orm";
import { creditLedger } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { refundCredits } from "@/lib/credits";

type RegistrationBonusSession = {
  user: {
    email: string;
    id: string;
  };
} | null | undefined;

type RegistrationBonusContext = {
  path: string;
  newSession: RegistrationBonusSession;
};

type HasExistingBonus = (userId: string) => Promise<boolean>;
type RefundBonus = typeof refundCredits;

type RegistrationBonusDeps = {
  hasExistingBonus?: HasExistingBonus;
  refund?: RefundBonus;
};

export async function hasRegistrationBonusLedgerEntry(userId: string) {
  const existingBonus = await db
    .select({ id: creditLedger.id })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.userId, userId),
        eq(creditLedger.reason, "registration_bonus")
      )
    )
    .limit(1);

  return existingBonus.length > 0;
}

export async function grantRegistrationBonusIfEligible(
  { newSession }: RegistrationBonusContext,
  deps: RegistrationBonusDeps = {}
) {
  if (!newSession?.user?.id) {
    return false;
  }

  const hasExistingBonus =
    deps.hasExistingBonus ?? hasRegistrationBonusLedgerEntry;
  const refund = deps.refund ?? refundCredits;

  if (await hasExistingBonus(newSession.user.id)) {
    return false;
  }

  await refund(newSession.user.id, 300, "registration_bonus");
  return true;
}
