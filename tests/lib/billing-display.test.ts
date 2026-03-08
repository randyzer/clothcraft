import {
  DEFAULT_ONE_TIME_PACK_KEY,
  getDefaultOneTimePack,
} from "@/lib/billing-display";

describe("getDefaultOneTimePack", () => {
  it("returns the configured default pack key", () => {
    expect(DEFAULT_ONE_TIME_PACK_KEY).toBe("pack_200");
  });

  it("returns the pack values from billing config", () => {
    expect(getDefaultOneTimePack()).toEqual({
      key: "pack_200",
      pack: {
        key: "pack_200",
        kind: "one_time",
        priceCents: 500,
        currency: "usd",
        credits: 200,
        creemPriceId: "prod_3SiroZeMbMQidMVFDMUzKy",
      },
      displayPrice: "$5",
    });
  });
});
