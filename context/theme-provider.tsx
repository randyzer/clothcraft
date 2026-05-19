"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = React.PropsWithChildren<{
  attribute?: "class" | `data-${string}`;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
  enableSystem?: boolean;
  storageKey?: string;
}>;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  themes: Theme[];
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function disableTransitions(nonce?: string) {
  const style = document.createElement("style");
  if (nonce) {
    style.setAttribute("nonce", nonce);
  }
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important}"
    )
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    setTimeout(() => {
      style.remove();
    }, 1);
  };
}

function applyTheme({
  attribute,
  disableTransitionOnChange,
  resolvedTheme,
}: {
  attribute: "class" | `data-${string}`;
  disableTransitionOnChange: boolean;
  resolvedTheme: ResolvedTheme;
}) {
  const restoreTransitions = disableTransitionOnChange
    ? disableTransitions()
    : undefined;
  const root = document.documentElement;

  if (attribute === "class") {
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  } else {
    root.setAttribute(attribute, resolvedTheme);
  }

  root.style.colorScheme = resolvedTheme;
  restoreTransitions?.();
}

export function ThemeProvider({
  attribute = "class",
  children,
  defaultTheme = "light",
  disableTransitionOnChange = false,
  enableSystem = false,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>("light");
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    setSystemTheme(getSystemTheme());

    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (
        storedTheme === "light" ||
        storedTheme === "dark" ||
        (enableSystem && storedTheme === "system")
      ) {
        setThemeState(storedTheme);
      }
    } catch {
      setThemeState(defaultTheme);
    }
  }, [defaultTheme, enableSystem, storageKey]);

  React.useEffect(() => {
    if (!enableSystem || typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => {
      setSystemTheme(query.matches ? "dark" : "light");
    };

    updateSystemTheme();
    query.addEventListener("change", updateSystemTheme);

    return () => {
      query.removeEventListener("change", updateSystemTheme);
    };
  }, [enableSystem]);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  React.useEffect(() => {
    applyTheme({
      attribute,
      disableTransitionOnChange,
      resolvedTheme,
    });
  }, [attribute, disableTransitionOnChange, resolvedTheme]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch {
        // Theme persistence is best-effort only.
      }
    },
    [storageKey]
  );

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
      themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
    }),
    [enableSystem, resolvedTheme, setTheme, systemTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
