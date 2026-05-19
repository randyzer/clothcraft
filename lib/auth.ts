import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "./db";
import { getGoogleAuthProvider } from "./auth/google-auth";
import { sendVerificationEmail as sendVerificationEmailMessage } from "./email";
import { grantRegistrationBonusIfEligible } from "./auth-registration";

const defaultTrustedOrigins = ["http://localhost:3000"];

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : defaultTrustedOrigins;

const googleAuthProvider = getGoogleAuthProvider();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ token, user }) {
      const result = await sendVerificationEmailMessage(user.email, token);
      if (!result.success) {
        throw result.error instanceof Error
          ? result.error
          : new Error("Failed to send verification email");
      }
    },
  },
  ...(googleAuthProvider
    ? {
        socialProviders: {
          google: googleAuthProvider,
        },
      }
    : {}),

  trustedOrigins,

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      try {
        const granted = await grantRegistrationBonusIfEligible({
          path: ctx.path,
          newSession: ctx.context.newSession,
        });

        if (granted && ctx.context.newSession) {
          console.log(
            `[Auth] New user registered, granted 300 credits: ${ctx.context.newSession.user.email}`
          );
        }
      } catch (error) {
        if (ctx.context.newSession) {
          console.error("[Auth] Failed to grant registration bonus:", error);
        }
      }
    }),
  },
});

export { hashPassword } from "better-auth/crypto";
