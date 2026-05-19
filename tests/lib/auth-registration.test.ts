import { grantRegistrationBonusIfEligible } from "@/lib/auth-registration";

describe("grantRegistrationBonusIfEligible", () => {
  it("grants the registration bonus for a new social sign-in session", async () => {
    const hasExistingBonus = vi.fn().mockResolvedValue(false);
    const refund = vi.fn().mockResolvedValue({
      success: true,
      remainingCredits: 300,
    });

    await grantRegistrationBonusIfEligible(
      {
        path: "/sign-in/social",
        newSession: {
          user: {
            id: "user-1",
            email: "google-user@example.com",
          },
        },
      },
      {
        hasExistingBonus,
        refund,
      }
    );

    expect(hasExistingBonus).toHaveBeenCalledWith("user-1");
    expect(refund).toHaveBeenCalledWith(
      "user-1",
      300,
      "registration_bonus"
    );
  });

  it("does not grant the registration bonus twice", async () => {
    const hasExistingBonus = vi.fn().mockResolvedValue(true);
    const refund = vi.fn();

    await grantRegistrationBonusIfEligible(
      {
        path: "/sign-up/email",
        newSession: {
          user: {
            id: "user-2",
            email: "repeat@example.com",
          },
        },
      },
      {
        hasExistingBonus,
        refund,
      }
    );

    expect(refund).not.toHaveBeenCalled();
  });

  it("does nothing when no new session is created", async () => {
    const hasExistingBonus = vi.fn();
    const refund = vi.fn();

    await grantRegistrationBonusIfEligible(
      {
        path: "/sign-in/social",
        newSession: null,
      },
      {
        hasExistingBonus,
        refund,
      }
    );

    expect(hasExistingBonus).not.toHaveBeenCalled();
    expect(refund).not.toHaveBeenCalled();
  });
});
