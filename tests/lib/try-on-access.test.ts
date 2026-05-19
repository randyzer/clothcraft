import {
  getShanghaiDayWindow,
  resolveTryOnEntitlement,
} from "@/lib/try-on-access";

describe("try-on access rules", () => {
  it("treats free users as limited to 3 generations per Shanghai day", () => {
    expect(resolveTryOnEntitlement({ userPlanKey: "free" })).toEqual({
      tier: "free",
      dailyLimit: 3,
      garmentLimit: 1,
      watermark: true,
    });
  });

  it("treats active non-free subscriptions as paid", () => {
    expect(
      resolveTryOnEntitlement({
        userPlanKey: "free",
        activeSubscriptionPlanKey: "starter_monthly",
      })
    ).toEqual({
      tier: "paid",
      dailyLimit: 20,
      garmentLimit: 3,
      watermark: false,
    });
  });

  it("treats non-free user plan keys as paid when no subscription row is present", () => {
    expect(resolveTryOnEntitlement({ userPlanKey: "pro_monthly" }).tier).toBe("paid");
  });

  it("uses Asia/Shanghai calendar days for usage windows", () => {
    const window = getShanghaiDayWindow(new Date("2026-05-19T02:30:00.000Z"));

    expect(window).toEqual({
      start: new Date("2026-05-18T16:00:00.000Z"),
      end: new Date("2026-05-19T16:00:00.000Z"),
    });
  });
});
