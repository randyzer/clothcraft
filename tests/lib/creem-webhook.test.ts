import {
  findBillingSelectionByProductId,
  getCreemEventPaymentId,
  getCreemEventProductId,
  parseCreemDateValue,
  parseCreemRequestId,
  verifyCreemRedirectSignature,
} from "@/lib/payments/creem-webhook";
import crypto from "node:crypto";

describe("creem webhook helpers", () => {
  it("maps Creem product ids back to internal billing selections", () => {
    expect(findBillingSelectionByProductId("prod_3GN5nUWbg4rPrUC9J7Z1YX")).toEqual({
      kind: "subscription",
      key: "starter_monthly",
    });
    expect(findBillingSelectionByProductId("prod_3SiroZeMbMQidMVFDMUzKy")).toEqual({
      kind: "one_time",
      key: "pack_200",
    });
  });

  it("extracts official subscription transaction identifiers", () => {
    expect(
      getCreemEventPaymentId({
        id: "evt_123",
        eventType: "subscription.paid",
        object: {
          id: "sub_123",
          last_transaction_id: "tran_123",
        },
      })
    ).toBe("tran_123");
  });

  it("extracts product ids from checkout and subscription payloads", () => {
    expect(
      getCreemEventProductId({
        eventType: "checkout.completed",
        object: {
          order: {
            product: "prod_order",
          },
        },
      })
    ).toBe("prod_order");

    expect(
      getCreemEventProductId({
        eventType: "subscription.paid",
        object: {
          product: {
            id: "prod_subscription",
          },
        },
      })
    ).toBe("prod_subscription");
  });

  it("parses official Creem period date strings", () => {
    expect(parseCreemDateValue("2026-06-19T07:22:00.000Z")?.toISOString()).toBe(
      "2026-06-19T07:22:00.000Z"
    );
  });

  it("parses internally generated request ids", () => {
    expect(parseCreemRequestId("subscription:starter_monthly:user_123")).toEqual({
      kind: "subscription",
      key: "starter_monthly",
      userId: "user_123",
    });
  });

  it("verifies Creem redirect signatures using official sorted params", async () => {
    const params = {
      checkout_id: "ch_123",
      order_id: "ord_123",
      customer_id: "cust_123",
      product_id: "prod_123",
      request_id: "subscription:starter_monthly:user_123",
      success: "1",
      signature: crypto
        .createHmac("sha256", "secret_key")
        .update(
          "checkout_id=ch_123&customer_id=cust_123&order_id=ord_123&product_id=prod_123&request_id=subscription:starter_monthly:user_123"
        )
        .digest("hex"),
    };

    expect(await verifyCreemRedirectSignature(params, "secret_key")).toBe(true);
    expect(
      await verifyCreemRedirectSignature(
        { ...params, product_id: "prod_tampered" },
        "secret_key"
      )
    ).toBe(false);
  });
});
