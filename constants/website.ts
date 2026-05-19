const toBoolean = (value: string | undefined): boolean =>
  value?.toLowerCase() === "true";

const DEFAULT_APP_URL = "https://clothcraft-three.vercel.app";

export const analyticsConfig = {
  enableInDevelopment: toBoolean(process.env.NEXT_PUBLIC_ANALYTICS_ENABLE_IN_DEVELOPMENT),
};

export const websiteConfig = {
  appName: "ClothCraft",
  docsName: "ClothCraft Docs",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).trim(),
};
