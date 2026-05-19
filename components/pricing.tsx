"use client";

import { IconCircleCheckFilled } from "@tabler/icons-react";
import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { subscriptionPlans } from "@/constants/billing";

const PAID_PLAN_KEY = "starter_monthly";

function formatUsdPrice(priceCents: number) {
  return `$${(priceCents / 100).toFixed(0)}`;
}

export function Pricing() {
  const session = useSession();
  const router = useRouter();
  const t = useTranslations("pricing");
  const locale = useLocale();
  const userId = session.data?.user?.id;
  const paidPlan = subscriptionPlans[PAID_PLAN_KEY];

  const tiers = [
    {
      id: "free",
      price: "$0",
      priceDetail: t("details.freeGenerations"),
      featured: false,
      cta: t("tiers.free.cta"),
      onClick: () => router.push(`/${locale}`),
    },
    {
      id: "paid",
      price: formatUsdPrice(paidPlan.priceCents),
      priceDetail: t("details.paidGenerations"),
      featured: true,
      cta: t("tiers.paid.cta"),
      onClick: async () => {
        if (!userId) {
          router.push(`/${locale}/signup`);
          return;
        }

        const res = await fetch("/api/payments/creem/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: PAID_PLAN_KEY, kind: "subscription" }),
        });

        if (!res.ok) {
          return;
        }

        const { url } = (await res.json()) as { url: string };
        window.location.href = url;
      },
    },
  ] as const;

  const handleTierClick = useCallback((onClick: () => void | Promise<void>) => {
    void onClick();
  }, []);

  return (
    <div className="relative z-20 mx-auto mt-4 grid w-full max-w-5xl grid-cols-1 items-stretch gap-4 md:mt-12 md:grid-cols-2">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={cn(
            tier.featured ? "relative bg-primary shadow-2xl" : "bg-card",
            "flex h-full flex-col justify-between rounded-lg px-6 py-8 sm:mx-8 lg:mx-0"
          )}
        >
          <div>
            <h3
              className={cn(
                tier.featured ? "text-primary-foreground" : "text-muted-foreground",
                "text-base font-semibold leading-7"
              )}
            >
              {t(`tiers.${tier.id}.name`)}
            </h3>
            <p className="mt-4">
              <span
                className={cn(
                  "inline-block text-4xl font-bold tracking-tight",
                  tier.featured ? "text-primary-foreground" : "text-foreground"
                )}
              >
                {tier.price}
              </span>
              {tier.id === "paid" && (
                <span className="ml-2 text-sm text-primary-foreground/80">
                  {t("details.perMonth")}
                </span>
              )}
            </p>
            <p
              className={cn(
                tier.featured ? "text-primary-foreground/80" : "text-muted-foreground",
                "mt-3 text-sm font-medium"
              )}
            >
              {tier.priceDetail}
            </p>
            <p
              className={cn(
                tier.featured ? "text-primary-foreground/80" : "text-muted-foreground",
                "mt-6 min-h-12 text-sm leading-7"
              )}
            >
              {t(`tiers.${tier.id}.description`)}
            </p>
            <ul
              role="list"
              className={cn(
                tier.featured ? "text-primary-foreground/80" : "text-muted-foreground",
                "mt-8 space-y-3 text-sm leading-6 sm:mt-10"
              )}
            >
              {(t.raw(`tiers.${tier.id}.features`) as string[]).map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <IconCircleCheckFilled
                    className={cn(
                      tier.featured ? "text-primary-foreground" : "text-muted-foreground",
                      "h-6 w-5 flex-none"
                    )}
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <Button
            onClick={() => handleTierClick(tier.onClick)}
            className={cn(
              tier.featured
                ? "bg-background text-foreground shadow-sm hover:bg-background/90 focus-visible:outline-background"
                : "",
              "mt-8 block w-full rounded-full px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10"
            )}
          >
            {tier.cta}
          </Button>
        </div>
      ))}
    </div>
  );
}
