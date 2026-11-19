import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { server } from "@/mocks/mock-server";
import { render } from "@/tests/integrations/test-utils";
import { setTrialUser, trialOffer } from "@/tests/integrations/trial-fixtures";
import SettingsBillingPage from "../page";
import { useBalanceCard } from "../components/AutomationCreditsTab/BalanceCard/useBalanceCard";
import { useAutoRefillCard } from "../components/AutomationCreditsTab/AutoRefillCard/useAutoRefillCard";
import { useCheckoutRetry } from "../components/CheckoutAbandonedPrompt/useCheckoutRetry";
import {
  describePlanResult,
  formatChoicePrice,
  getOwnPlanChoice,
  getUpgradePlanChoice,
} from "../components/SubscriptionTab/TrialPlanChoices/helpers";
import { useTrialPlanChoices } from "../components/SubscriptionTab/TrialPlanChoices/useTrialPlanChoices";
import { useTierUpgradePreview } from "../components/SubscriptionTab/YourPlanCard/useTierUpgradePreview";
import { maxUpgradePreview } from "./max-upgrade.fixture";
import {
  mockBilling,
  mockPlanRequest,
  trialSubscription,
  yearlyOffer,
} from "./trial-plan-fixtures";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock("@/components/molecules/Toast/use-toast", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/components/molecules/Toast/use-toast")
  >()),
  toast: mocks.toast,
}));

vi.mock("@/hooks/useIsBillingEnabled", () => ({
  useIsBillingEnabled: () => true,
  useBillingStatus: () => ({ isBillingEnabled: true, isResolved: true }),
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useSearchParams: () => mocks.searchParams,
  usePathname: () => "/settings/billing",
  useRouter: () => ({
    replace: mocks.replace,
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const clients: QueryClient[] = [];

function makeWrapper(locale: Locale = "zh-CN") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  setTrialUser("billing-localization-user");
  mocks.toast.mockClear();
  mocks.replace.mockClear();
  mocks.searchParams = new URLSearchParams();
  server.use(
    http.get("*/api/credits", () => HttpResponse.json({ credits: 1000 })),
    http.get("*/api/credits/auto-top-up", () =>
      HttpResponse.json({ amount: 0, threshold: 0 }),
    ),
  );
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  setTrialUser(null);
});

describe("billing dynamic notification localization", () => {
  test.each(["zh-CN", "en"] as const)(
    "localizes missing top-up checkout URL in %s without changing the request",
    async (locale) => {
      let body: unknown;
      server.use(
        http.post("*/api/credits", async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ checkout_url: null });
        }),
      );
      const { result } = renderHook(useBalanceCard, {
        wrapper: makeWrapper(locale),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.setAmount("25"));
      act(() => result.current.handleSubmit());
      await waitFor(() =>
        expect(mocks.toast).toHaveBeenCalledWith({
          title:
            locale === "zh-CN" ? "无法开始结账" : "Couldn't start checkout",
          description:
            locale === "zh-CN"
              ? "Stripe 未返回结账链接。请查看后端日志以了解具体的 Stripe 错误。"
              : "Stripe didn't return a checkout URL. Check backend logs for the underlying Stripe error.",
          variant: "destructive",
        }),
      );
      expect(body).toEqual({ credit_amount: 2500, surface: "billing" });
    },
  );

  test("preserves the backend Stripe error in the translated checkout toast", async () => {
    server.use(
      http.post("*/api/credits", () =>
        HttpResponse.json(
          { detail: "STRIPE_E402: card_declined" },
          { status: 400 },
        ),
      ),
    );
    const { result } = renderHook(useBalanceCard, { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setAmount("5"));
    act(() => result.current.handleSubmit());
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "无法开始结账",
        description: "STRIPE_E402: card_declined",
        variant: "destructive",
      }),
    );
  });

  test.each(["save", "disable"] as const)(
    "localizes auto top-up %s failure and preserves backend errors and cents",
    async (operation) => {
      let body: unknown;
      server.use(
        http.post("*/api/credits/auto-top-up", async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(
            { detail: "BILLING_E409: original error" },
            { status: 400 },
          );
        }),
      );
      const { result } = renderHook(useAutoRefillCard, {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => {
        result.current.setThreshold("5");
        result.current.setRefillAmount("20");
      });
      act(() => result.current[operation]());
      await waitFor(() =>
        expect(mocks.toast).toHaveBeenCalledWith({
          title:
            operation === "save" ? "无法保存自动充值设置" : "无法关闭自动充值",
          description: "BILLING_E409: original error",
          variant: "destructive",
        }),
      );
      expect(body).toEqual(
        operation === "save"
          ? { amount: 2000, threshold: 500 }
          : { amount: 0, threshold: 0 },
      );
    },
  );

  test("localizes retry guidance but preserves checkout tier, cycle and surface", async () => {
    const body = mockPlanRequest(() =>
      HttpResponse.json({ ...trialSubscription, url: "" }),
    );
    const { result } = renderHook(
      () => useCheckoutRetry({ tier: "PRO", cycle: "yearly" }),
      { wrapper: makeWrapper() },
    );
    await act(async () => result.current.retry?.());
    expect(mocks.toast).toHaveBeenCalledWith({
      title: "无法打开结账页面",
      description: "请在下方重新选择套餐以重试。",
      variant: "destructive",
    });
    expect(body).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: "PRO",
        billing_cycle: "yearly",
        surface: "billing",
      }),
    );
  });

  test("localizes trial plan descriptions, price cadence and results without changing brands or enums", () => {
    const own = getOwnPlanChoice(trialOffer, "zh-CN");
    expect(own).toMatchObject({
      tier: "PRO",
      label: "Pro",
      amount: "$20",
      cadence: "month",
      description: "今天生效。试用将结束并切换至该套餐。",
    });
    expect(getOwnPlanChoice(trialOffer).description).toBe(
      "Starts today. Your trial ends and the plan takes over.",
    );
    expect(
      getUpgradePlanChoice(trialOffer, trialSubscription, "zh-CN"),
    ).toMatchObject({
      tier: "MAX",
      label: "Max",
      description: "用量为 Pro 的 8.5 倍，适合高频使用者。",
    });
    expect(
      getUpgradePlanChoice(
        trialOffer,
        { ...trialSubscription, tier_multipliers: undefined },
        "zh-CN",
      )?.description,
    ).toBe("比 Pro 提供更多用量，适合高频使用者。");
    expect(formatChoicePrice(own, "zh-CN")).toBe("$20 / 月");
    expect(formatChoicePrice(getOwnPlanChoice(yearlyOffer), "zh-CN")).toBe(
      "$510 / 年",
    );
    expect(formatChoicePrice(own)).toBe("$20 / month");
    expect(describePlanResult(own, "PRO", "zh-CN")).toEqual({
      title: "你已开始使用 Pro",
      description: "你的试用已结束，套餐从今天开始生效。",
    });
    expect(describePlanResult(own, "TRIAL", "zh-CN")).toEqual({
      title: "已收到付款",
      description: "你的套餐仍在设置中，就绪后此页面会自动更新。",
    });
    expect(describePlanResult(own, "PRO").title).toBe("You're on Pro");
  });

  test("propagates locale into trial plan choices and the confirmed success toast", async () => {
    const { state } = mockBilling();
    const body = mockPlanRequest(() => {
      state.subscription = { ...trialSubscription, tier: "PRO" };
      return HttpResponse.json({ ...state.subscription, url: "" });
    });
    const { result } = renderHook(() => useTrialPlanChoices(trialOffer), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isVisible).toBe(true));
    expect(result.current.ownPlan.description).toBe(
      "今天生效。试用将结束并切换至该套餐。",
    );
    expect(result.current.upgradePlan?.description).toBe(
      "用量为 Pro 的 8.5 倍，适合高频使用者。",
    );
    act(() => result.current.onSelectOwnPlan());
    act(() => result.current.onConfirmPlan());
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "你已开始使用 Pro",
        description: "你的试用已结束，套餐从今天开始生效。",
      }),
    );
    expect(body).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: "PRO",
        billing_cycle: "monthly",
        surface: "billing",
      }),
    );
  });

  test("localizes a plan changed in another tab without submitting a charge", async () => {
    const { state } = mockBilling();
    const body = mockPlanRequest(() =>
      HttpResponse.json({ ...trialSubscription, url: "" }),
    );
    const { result } = renderHook(() => useTrialPlanChoices(trialOffer), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isVisible).toBe(true));
    act(() => result.current.onSelectOwnPlan());
    state.subscription = { ...trialSubscription, tier: "PRO" };
    act(() => result.current.onConfirmPlan());
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "你的套餐已更改",
        description: "请在下方查看当前套餐。",
      }),
    );
    expect(body).not.toHaveBeenCalled();
  });

  test("localizes dynamic trial plan failure titles and preserves the provider error", async () => {
    mockBilling();
    mockPlanRequest(() =>
      HttpResponse.json(
        { detail: "BANK_E402: authentication_required" },
        { status: 400 },
      ),
    );
    const { result } = renderHook(() => useTrialPlanChoices(trialOffer), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isVisible).toBe(true));
    act(() => result.current.onSelectOwnPlan());
    act(() => result.current.onConfirmPlan());
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "无法开始使用 Pro",
        description: "BANK_E402: authentication_required",
        variant: "destructive",
      }),
    );
  });

  test("localizes subscription return confirmation without repeating it on rerender", async () => {
    mockBilling();
    mocks.searchParams = new URLSearchParams({ subscription: "success" });
    const { rerender } = render(
      <LanguageProvider initialLocale="zh-CN">
        <SettingsBillingPage />
      </LanguageProvider>,
    );
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "正在确认你的订阅",
        description: "正在应用新套餐，可能需要稍等片刻才能显示。",
      }),
    );
    rerender(
      <LanguageProvider initialLocale="zh-CN">
        <SettingsBillingPage />
      </LanguageProvider>,
    );
    expect(mocks.toast).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith("/settings/billing");
  });

  test("localizes upgrade review failure, expiry and default invalidation while preserving supplied messages", async () => {
    server.use(
      http.post("*/api/credits/subscription/preview", () =>
        HttpResponse.json({}, { status: 400 }),
      ),
    );
    const { result } = renderHook(
      () => useTierUpgradePreview(true, "monthly"),
      { wrapper: makeWrapper() },
    );
    await waitFor(() =>
      expect(result.current.error).toBe("无法加载本次费用。请重试后再升级。"),
    );
    server.use(
      http.post("*/api/credits/subscription/preview", () =>
        HttpResponse.json(
          maxUpgradePreview({ expires_at: Math.floor(Date.now() / 1000) - 1 }),
        ),
      ),
    );
    act(() => result.current.retry());
    await waitFor(() =>
      expect(result.current.error).toBe(
        "本次费用核对已过期。请重新核对后再付款。",
      ),
    );
    server.use(
      http.post("*/api/credits/subscription/preview", () =>
        HttpResponse.json(maxUpgradePreview()),
      ),
    );
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.preview).toBeDefined());
    act(() => result.current.invalidate());
    expect(result.current.error).toBe(
      "你的账单信息已更改。请核对更新后的费用再付款。",
    );
    act(() => result.current.invalidate("PROVIDER_E409: original message"));
    expect(result.current.error).toBe("PROVIDER_E409: original message");
  });
});
