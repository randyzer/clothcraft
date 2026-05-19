export type MembershipTier = "free" | "pro";

export function getMembershipTier(planKey?: string | null): MembershipTier {
  if (!planKey || planKey === "free") {
    return "free";
  }

  return "pro";
}
