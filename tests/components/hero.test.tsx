/* eslint-disable @next/next/no-img-element */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import messages from "@/messages/en.json";
import { Hero } from "@/components/hero";

const routerPushMock = vi.fn();

function getNestedValue(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return (value as Record<string, unknown>)[key];
    }

    return undefined;
  }, source);
}

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace?: string) => {
    const root = namespace
      ? (getNestedValue(messages as Record<string, unknown>, namespace) as Record<string, unknown>)
      : (messages as Record<string, unknown>);

    return (path: string) => {
      const value = getNestedValue(root, path);

      if (typeof value !== "string") {
        throw new Error(`Missing translation for ${namespace ?? "root"}:${path}`);
      }

      return value;
    };
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.PropsWithChildren<{ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) => {
    const { alt, src, priority, ...imgProps } = props;
    void priority;

    return <img alt={alt} src={src} {...imgProps} />;
  },
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_target, tag) => {
        return (props: React.PropsWithChildren<Record<string, unknown>>) => {
          const {
            children,
            initial,
            animate,
            exit,
            transition,
            ...elementProps
          } = props;

          void initial;
          void animate;
          void exit;
          void transition;

          return React.createElement(
            typeof tag === "string" ? tag : "div",
            elementProps,
            children
          );
        };
      },
    }
  ),
}));

describe("Hero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the AI outfit try-on workspace in the homepage hero", () => {
    render(<Hero />);

    expect(
      screen.getByRole("heading", {
        name: "AI Outfit Try-On",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Upload model")).toBeInTheDocument();
    expect(screen.getByText("Garment 1")).toBeInTheDocument();
    expect(screen.getByText("Garment 2")).toBeInTheDocument();
    expect(screen.getByText("Garment 3")).toBeInTheDocument();
    expect(screen.getByText("Free: 3 generations/day, 1 garment, watermark")).toBeInTheDocument();
    expect(screen.getByText("Paid: 200 generations/month, 3 garments, no watermark")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate try-on" })).toBeDisabled();
  });

  it("starts in paid mode so all three garment slots are available for core try-on testing", () => {
    render(<Hero />);

    expect(screen.getByRole("button", { name: "Paid" })).toHaveClass("text-foreground");
    expect(screen.getByRole("button", { name: /Garment 2/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /Garment 3/ })).not.toBeDisabled();
  });

  it("keeps both generate icons mounted while switching loading state", () => {
    render(<Hero />);

    const generateButton = screen.getByRole("button", { name: "Generate try-on" });
    expect(generateButton.querySelector('[data-icon-state="idle"]')).toBeInTheDocument();
    expect(generateButton.querySelector('[data-icon-state="loading"]')).toBeInTheDocument();

    fireEvent.click(generateButton);

    expect(generateButton.querySelector('[data-icon-state="idle"]')).toBeInTheDocument();
    expect(generateButton.querySelector('[data-icon-state="loading"]')).toBeInTheDocument();
  });
});
