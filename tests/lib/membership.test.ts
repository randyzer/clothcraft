import { getMembershipTier } from "@/lib/membership";

describe("membership", () => {
  it("treats missing and free plans as free", () => {
    expect(getMembershipTier()).toBe("free");
    expect(getMembershipTier(null)).toBe("free");
    expect(getMembershipTier("free")).toBe("free");
  });

  it("treats any paid subscription plan as pro", () => {
    expect(getMembershipTier("starter_monthly")).toBe("pro");
    expect(getMembershipTier("starter_yearly")).toBe("pro");
    expect(getMembershipTier("pro_monthly")).toBe("pro");
    expect(getMembershipTier("pro_yearly")).toBe("pro");
  });
});
