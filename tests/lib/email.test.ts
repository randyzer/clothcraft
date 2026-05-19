import { getResendClient, sendEmail } from "@/lib/email";

const resendSendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(function MockResend() {
    return {
      emails: {
        send: resendSendMock,
      },
    };
  }),
}));

describe("email client", () => {
  beforeEach(() => {
    resendSendMock.mockReset();
  });

  it("does not construct a resend client when the API key is missing", () => {
    expect(getResendClient(undefined)).toBeNull();
  });

  it("returns a controlled error instead of throwing when email is disabled", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    try {
      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Hello",
          html: "<p>Test</p>",
        })
      ).resolves.toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: "RESEND_API_KEY is not configured",
        }),
      });
    } finally {
      if (originalKey) {
        process.env.RESEND_API_KEY = originalKey;
      }
    }
  });

  it("treats resend validation errors as failures", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.RESEND_FROM_EMAIL;
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "Sistine AI <onboarding@resend.dev>";
    resendSendMock.mockResolvedValue({
      error: {
        message: "sandbox restriction",
        name: "validation_error",
        statusCode: 403,
      },
    });

    try {
      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Hello",
          html: "<p>Test</p>",
        })
      ).resolves.toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: "sandbox restriction",
        }),
      });
    } finally {
      if (originalKey) {
        process.env.RESEND_API_KEY = originalKey;
      } else {
        delete process.env.RESEND_API_KEY;
      }
      if (originalFrom) {
        process.env.RESEND_FROM_EMAIL = originalFrom;
      } else {
        delete process.env.RESEND_FROM_EMAIL;
      }
    }
  });
});
