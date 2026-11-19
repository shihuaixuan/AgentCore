import LoginPage from "../login/page";
import SignupPage from "../signup/page";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { login, signup, toast, navigation } = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
  toast: vi.fn(),
  navigation: { params: new URLSearchParams() },
}));

vi.mock("../login/actions", () => ({ login }));
vi.mock("../signup/actions", () => ({ signup }));
vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isUserLoading: false, isLoggedIn: false }),
}));
vi.mock("@/providers/onboarding/onboarding-provider", () => ({
  default: function OnboardingProvider({ children }: { children: ReactNode }) {
    return <>{children}</>;
  },
}));
vi.mock("@/hooks/useCaptureMarketingPrompt", () => ({
  useCaptureMarketingPrompt: () => {},
}));
vi.mock("@/components/molecules/Toast/use-toast", async (original) => ({
  ...(await original<object>()),
  useToast: () => ({ toast, dismiss: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => navigation.params,
  usePathname: () => "/login",
}));

beforeEach(() => {
  vi.clearAllMocks();
  navigation.params = new URLSearchParams();
});

describe("auth page localization", () => {
  it.each([
    ["Invalid email or password", "邮箱或密码无效"],
    ["Failed to login. Please try again.", "登录失败，请重试。"],
    [
      "Upstream failure AADSTS50011 https://example.com/raw",
      "Upstream failure AADSTS50011 https://example.com/raw",
    ],
  ])(
    "localizes owned login feedback but preserves raw error %s",
    async (error, expected) => {
      login.mockResolvedValue({ success: false, error });
      render(
        <LanguageProvider>
          <LoginPage />
        </LanguageProvider>,
      );
      fireEvent.change(screen.getByLabelText("邮箱"), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByLabelText("密码", { selector: "input" }), {
        target: { value: "validpassword123" },
      });
      fireEvent.click(screen.getByRole("button", { name: "登录" }));
      await waitFor(() =>
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({ title: expected, variant: "destructive" }),
        ),
      );
      expect(login).toHaveBeenCalledWith(
        "user@example.com",
        "validpassword123",
        null,
      );
    },
  );

  it.each([
    ["Failed to sign up. Please try again.", "注册失败，请重试。"],
    [
      "Failed to complete account setup. Please try again.",
      "无法完成账户设置，请重试。",
    ],
    ["Raw provider failure CODE_123", "Raw provider failure CODE_123"],
  ])(
    "localizes owned signup feedback but preserves raw error %s",
    async (error, expected) => {
      signup.mockResolvedValue({ success: false, error });
      render(
        <LanguageProvider>
          <SignupPage />
        </LanguageProvider>,
      );
      fireEvent.change(await screen.findByLabelText("邮箱"), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByLabelText("密码", { selector: "input" }), {
        target: { value: "validpassword123" },
      });
      fireEvent.change(
        screen.getByLabelText("确认密码", { selector: "input" }),
        { target: { value: "validpassword123" } },
      );
      fireEvent.click(screen.getByRole("button", { name: "注册" }));
      await waitFor(() =>
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({ title: expected, variant: "destructive" }),
        ),
      );
      expect(signup).toHaveBeenCalledWith(
        "user@example.com",
        "validpassword123",
        "validpassword123",
        false,
        null,
      );
    },
  );

  it.each([
    ["access_denied", "Microsoft 登录已取消。"],
    ["BANNED_USER", "此账户已被封禁。如有异议，请联系支持团队。"],
    ["SIGN_IN_BLOCKED", "不允许此次登录。如有异议，请联系支持团队。"],
    [
      "SIGN_UP_BLOCKED",
      "不允许此次注册。请使用其他登录方式；如有异议，请联系支持团队。",
    ],
    ["unknown_provider_code", "登录未完成。请重试或使用其他登录方式。"],
  ])(
    "localizes callback notices without exposing the raw provider enum %s",
    (error, expected) => {
      navigation.params = new URLSearchParams({ provider: "microsoft", error });
      render(
        <LanguageProvider>
          <LoginPage />
        </LanguageProvider>,
      );
      expect(screen.getByText(expected)).toBeDefined();
      expect(navigation.params.get("error")).toBe(error);
    },
  );
});
