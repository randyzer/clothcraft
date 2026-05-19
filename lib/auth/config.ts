type AuthConfigEnv = {
  BETTER_AUTH_URL?: string | undefined;
  NEXT_PUBLIC_APP_URL?: string | undefined;
  BETTER_AUTH_TRUSTED_ORIGINS?: string | undefined;
};

const DEFAULT_APP_ORIGIN = "https://clothcraft-three.vercel.app";

const LOCAL_AUTH_HOSTS = [
  "localhost:3000",
  "127.0.0.1:3000",
  "localhost:3001",
  "127.0.0.1:3001",
];

function normalizeOrigin(value?: string) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    return new URL(trimmedValue).origin;
  } catch {
    return undefined;
  }
}

function getRuntimeAuthConfigEnv(): AuthConfigEnv {
  return {
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    BETTER_AUTH_TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
  };
}

export function getAuthBaseURLConfig(env: AuthConfigEnv = getRuntimeAuthConfigEnv()) {
  const fallback =
    normalizeOrigin(env.BETTER_AUTH_URL) ??
    normalizeOrigin(env.NEXT_PUBLIC_APP_URL) ??
    DEFAULT_APP_ORIGIN;
  const configuredHost = new URL(fallback).host;

  return {
    allowedHosts: Array.from(
      new Set([...LOCAL_AUTH_HOSTS, configuredHost, "*.vercel.app"])
    ),
    fallback,
  };
}

export function getAuthTrustedOrigins(env: AuthConfigEnv = getRuntimeAuthConfigEnv()) {
  return (
    env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}
