import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/context/theme-provider";

function ThemeControl() {
  const { theme, setTheme } = useTheme();

  return (
    <button type="button" onClick={() => setTheme("dark")}>
      Current theme: {theme}
    </button>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("does not render a script tag inside the React tree", () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <div>content</div>
      </ThemeProvider>
    );

    expect(container.querySelector("script")).not.toBeInTheDocument();
  });

  it("updates the html class when the theme changes", async () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <ThemeControl />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Current theme: light" }));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });
  });
});
