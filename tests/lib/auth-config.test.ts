import {
  getAuthBaseURLConfig,
  getAuthTrustedOrigins,
} from "@/lib/auth/config";

describe("auth config", () => {
  it("allows local development and the configured production host", () => {
    expect(
      getAuthBaseURLConfig({
        BETTER_AUTH_URL: "https://clothcraft-three.vercel.app/",
      })
    ).toEqual({
      allowedHosts: [
        "localhost:3000",
        "127.0.0.1:3000",
        "localhost:3001",
        "127.0.0.1:3001",
        "clothcraft-three.vercel.app",
        "*.vercel.app",
      ],
      fallback: "https://clothcraft-three.vercel.app",
    });
  });

  it("keeps explicit trusted origins additive", () => {
    expect(
      getAuthTrustedOrigins({
        BETTER_AUTH_TRUSTED_ORIGINS:
          "https://example.com, https://preview.example.com ",
      })
    ).toEqual(["https://example.com", "https://preview.example.com"]);
  });
});
