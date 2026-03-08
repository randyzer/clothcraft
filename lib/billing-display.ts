import { PackKey, oneTimePacks } from "@/constants/billing";

export const DEFAULT_ONE_TIME_PACK_KEY: PackKey = "pack_200";

export function getDefaultOneTimePack() {
  const pack = oneTimePacks[DEFAULT_ONE_TIME_PACK_KEY];

  return {
    key: DEFAULT_ONE_TIME_PACK_KEY,
    pack,
    displayPrice: `$${(pack.priceCents / 100).toFixed(0)}`,
  };
}
