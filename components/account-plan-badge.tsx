"use client";

import { Crown, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { getMembershipTier } from "@/lib/membership";
import { cn } from "@/lib/utils";

type AccountPlanBadgeProps = {
  planKey?: string | null;
  className?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
};

export function AccountPlanBadge({
  planKey,
  className,
  size = "md",
  showIcon = true,
}: AccountPlanBadgeProps) {
  const t = useTranslations("common.planBadges");
  const tier = getMembershipTier(planKey);
  const isPro = tier === "pro";
  const Icon = isPro ? Crown : UserRound;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold leading-none",
        size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        isPro
          ? "border-primary/40 bg-primary text-primary-foreground shadow-[0_0_18px_rgba(91,174,0,0.28)]"
          : "border-border bg-muted text-muted-foreground",
        className
      )}
      title={isPro ? t("proTitle") : t("freeTitle")}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      {t(tier)}
    </span>
  );
}
