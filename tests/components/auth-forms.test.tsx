import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import messages from "@/messages/en.json";
import { LoginForm } from "@/features/auth/components/login-form";
import { SignupForm } from "@/features/auth/components/signup-form";

const routerPushMock = vi.fn();
const authClientMocks = vi.hoisted(() => ({
  signInEmailMock: vi.fn(),
  signInSocialMock: vi.fn(),
  signUpEmailMock: vi.fn(),
}));

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

vi.mock("@/lib/auth-client", () => ({
  signIn: {
    email: authClientMocks.signInEmailMock,
    social: authClientMocks.signInSocialMock,
  },
  signUp: {
    email: authClientMocks.signUpEmailMock,
  },
}));

describe("auth forms", () => {
  beforeEach(() => {
    routerPushMock.mockReset();
    authClientMocks.signInEmailMock.mockReset();
    authClientMocks.signInSocialMock.mockReset();
    authClientMocks.signUpEmailMock.mockReset();
  });

  it("hides the Google button on login when Google auth is disabled", () => {
    render(<LoginForm showGoogleAuth={false} />);

    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
  });

  it("hides the Google button on signup when Google auth is disabled", () => {
    render(<SignupForm showGoogleAuth={false} />);

    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
  });

  it("still renders the Google button when Google auth is enabled", () => {
    render(<LoginForm showGoogleAuth />);

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
  });

  it("redirects to check-email after a successful signup without calling a custom resend endpoint", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    authClientMocks.signUpEmailMock.mockResolvedValue({ error: null });

    render(<SignupForm showGoogleAuth={false} />);

    await userEvent.type(screen.getByLabelText("Full name"), "Randy");
    await userEvent.type(screen.getByLabelText("Email address"), "randy@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(authClientMocks.signUpEmailMock).toHaveBeenCalledWith({
      email: "randy@example.com",
      password: "password123",
      name: "Randy",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(routerPushMock).toHaveBeenCalledWith("/en/check-email");

    fetchSpy.mockRestore();
  });
});
