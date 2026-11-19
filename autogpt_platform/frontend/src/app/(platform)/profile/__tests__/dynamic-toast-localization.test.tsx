import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getGetV1ListUserApiKeysMockHandler } from "@/app/api/__generated__/endpoints/api-keys/api-keys.msw";
import type { SubscriptionStatusResponse } from "@/app/api/__generated__/models/subscriptionStatusResponse";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { server } from "@/mocks/mock-server";
import { useAPISection } from "../(user)/api-keys/components/APIKeySection/useAPISection";
import { useAPIkeysModals } from "../(user)/api-keys/components/APIKeysModals/useAPIkeysModals";
import { getTierLabel } from "../(user)/credits/components/SubscriptionTierSection/helpers";
import { useSubscriptionTierSection } from "../(user)/credits/components/SubscriptionTierSection/useSubscriptionTierSection";
import { useNotificationForm } from "../(user)/settings/components/SettingsForm/components/NotificationForm/useNotificationForm";
import { useTimezoneForm } from "../(user)/settings/components/SettingsForm/components/TimezoneForm/useTimezoneForm";
import { useTimezoneDetection } from "../(user)/settings/useTimezoneDetection";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock("@/components/molecules/Toast/use-toast", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/components/molecules/Toast/use-toast")
  >()),
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/hooks/usePlatformPayment", () => ({
  usePlatformPayment: () => ({ isPaymentEnabled: true }),
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useSearchParams: () => mocks.searchParams,
  usePathname: () => "/profile/credits",
  useRouter: () => mocks,
}));

const clients: QueryClient[] = [];
const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const subscription: SubscriptionStatusResponse = {
  tier: "PRO",
  monthly_cost: 5000,
  tier_costs: { BASIC: 1000, PRO: 5000, MAX: 32000, BUSINESS: 50000 },
  proration_credit_cents: 0,
  has_active_stripe_subscription: true,
};

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
  mocks.toast.mockClear();
  mocks.replace.mockClear();
  mocks.searchParams = new URLSearchParams();
  server.use(
    getGetV1ListUserApiKeysMockHandler([]),
    http.get("*/api/credits/subscription", () =>
      HttpResponse.json(subscription),
    ),
  );
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  if (originalClipboard)
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

describe("legacy profile dynamic notification localization", () => {
  test.each([
    ["BASIC", "基础版", "Basic"],
    ["BUSINESS", "团队版", "Business"],
    ["ENTERPRISE", "企业版", "Enterprise"],
    ["PRO", "Pro", "Pro"],
    ["MAX", "Max", "Max"],
    ["NO_TIER", "无订阅", "No subscription"],
    ["CUSTOM_TIER", "Custom_tier", "Custom_tier"],
  ])(
    "localizes known tier %s without changing brands or custom fallback",
    (tier, chinese, english) => {
      expect(getTierLabel(tier, "zh-CN")).toBe(chinese);
      expect(getTierLabel(tier)).toBe(english);
    },
  );

  test.each([false, true])(
    "localizes legacy API revocation (failure=%s) and preserves the ID",
    async (failure) => {
      let keyID: unknown;
      server.use(
        http.delete("*/api/api-keys/:keyId", ({ params }) => {
          keyID = params.keyId;
          return HttpResponse.json(
            failure ? { detail: "PROVIDER_E409: original error" } : {},
            { status: failure ? 400 : 200 },
          );
        }),
      );
      const { result } = renderHook(useAPISection, { wrapper: makeWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await act(async () => result.current.handleRevokeKey("Raw-Key-ID"));
      expect(keyID).toBe("Raw-Key-ID");
      expect(mocks.toast).toHaveBeenCalledWith(
        failure
          ? {
              title: "错误",
              description: "撤销 AutoGPT 平台 API 密钥失败",
              variant: "destructive",
            }
          : { title: "成功", description: "AutoGPT 平台 API 密钥已成功撤销" },
      );
    },
  );

  test("localizes legacy API creation failure without translating the submitted name or permissions", async () => {
    let body: unknown;
    server.use(
      http.post("*/api/api-keys", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ detail: "original error" }, { status: 400 });
      }),
    );
    const { result } = renderHook(useAPIkeysModals, { wrapper: makeWrapper() });
    act(() =>
      result.current.setKeyState({
        newKeyName: "My API key",
        newKeyDescription: "My raw description",
        newApiKey: "",
        selectedPermissions: ["READ_RUN"],
      }),
    );
    await act(async () => result.current.handleCreateKey());
    expect(body).toEqual({
      name: "My API key",
      description: "My raw description",
      permissions: ["READ_RUN"],
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: "错误",
      description: "创建 AutoGPT 平台 API 密钥失败",
      variant: "destructive",
    });
  });

  test.each(["zh-CN", "en"] as const)(
    "localizes legacy clipboard confirmation in %s and copies the raw key",
    async (locale) => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
      const { result } = renderHook(useAPIkeysModals, {
        wrapper: makeWrapper(locale),
      });
      act(() =>
        result.current.setKeyState((state) => ({
          ...state,
          newApiKey: "agpt_raw_SECRET-AbC123",
        })),
      );
      await act(async () => result.current.handleCopyKey());
      expect(writeText).toHaveBeenCalledWith("agpt_raw_SECRET-AbC123");
      expect(mocks.toast).toHaveBeenCalledWith({
        title: locale === "zh-CN" ? "已复制" : "Copied",
        description:
          locale === "zh-CN"
            ? "AutoGPT 平台 API 密钥已复制到剪贴板"
            : "AutoGPT Platform API key copied to clipboard",
      });
    },
  );

  test.each([
    ["NO_TIER", "你的订阅将在当前账单周期结束时取消，之后不再扣费。"],
    [
      "BASIC",
      "你的套餐将在当前账单周期结束时降级至基础版；此后将按新的较低费率向已保存的银行卡扣款。",
    ],
    [
      "BUSINESS",
      "已升级至团队版。下次出账时，将向已保存的银行卡收取按比例计算的升级费用，以及按新费率计算的下月费用。",
    ],
    [
      "ENTERPRISE",
      "已升级至企业版。下次出账时，将向已保存的银行卡收取按比例计算的升级费用，以及按新费率计算的下月费用。",
    ],
  ])(
    "localizes legacy change-tier result for %s while preserving the API enum",
    async (tier, description) => {
      let body: unknown;
      server.use(
        http.post("*/api/credits/subscription", async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ ...subscription, url: "" });
        }),
      );
      const { result } = renderHook(useSubscriptionTierSection, {
        wrapper: makeWrapper(),
      });
      await waitFor(() =>
        expect(result.current.subscription?.tier).toBe("PRO"),
      );
      await act(async () => result.current.changeTier(tier));
      expect(body).toEqual(expect.objectContaining({ tier }));
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "订阅已更新",
        description,
      });
    },
  );

  test("localizes subscription-load fallback", async () => {
    server.use(
      http.get("*/api/credits/subscription", () =>
        HttpResponse.json({ detail: "original error" }, { status: 400 }),
      ),
    );
    const { result } = renderHook(useSubscriptionTierSection, {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.error).toBe("无法加载订阅信息"));
  });

  test("localizes checkout return notification", async () => {
    mocks.searchParams = new URLSearchParams({ subscription: "success" });
    renderHook(useSubscriptionTierSection, { wrapper: makeWrapper() });
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "订阅已升级",
        description: "你的套餐已更新，可能需要稍等片刻才能显示。",
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/profile/credits");
  });

  test.each([false, true])(
    "localizes cancelling a pending subscription change (failure=%s) while retaining provider errors",
    async (failure) => {
      server.use(
        http.post("*/api/credits/subscription", () =>
          HttpResponse.json(
            failure
              ? { detail: "BILLING_E409: original error" }
              : { ...subscription, url: "" },
            { status: failure ? 400 : 200 },
          ),
        ),
      );
      const { result } = renderHook(useSubscriptionTierSection, {
        wrapper: makeWrapper(),
      });
      await waitFor(() =>
        expect(result.current.subscription?.tier).toBe("PRO"),
      );
      await act(async () => result.current.cancelPendingChange());
      expect(mocks.toast).toHaveBeenCalledWith(
        failure
          ? {
              title: "无法取消待生效的更改",
              description: "BILLING_E409: original error",
              variant: "destructive",
            }
          : { title: "已取消待生效的订阅更改。" },
      );
      expect(result.current.tierError).toBe(
        failure ? "BILLING_E409: original error" : null,
      );
    },
  );

  test.each([false, true])(
    "localizes legacy notification saves (failure=%s) and preserves errors and preference values",
    async (failure) => {
      let body: unknown;
      const preferences = {
        user_id: "user-1",
        email: "Raw.Address@example.com",
        briefing_frequency: "WEEKLY" as const,
        alerts_enabled: true,
        store_verdicts_enabled: true,
        daily_limit: 0,
      };
      server.use(
        http.post("*/api/auth/user/preferences", async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(
            failure ? { detail: "NOTIFY_E409: original error" } : preferences,
            { status: failure ? 400 : 200 },
          );
        }),
      );
      const { result } = renderHook(
        () =>
          useNotificationForm({
            preferences,
            user: {
              id: "user-1",
              email: "Raw.Address@example.com",
              user_metadata: {},
            },
          }),
        { wrapper: makeWrapper() },
      );
      await act(async () =>
        result.current.onSubmit({
          briefingFrequency: "MONTHLY",
          alertsEnabled: false,
          storeVerdictsEnabled: true,
        }),
      );
      expect(body).toEqual({
        email: "Raw.Address@example.com",
        briefing_frequency: "MONTHLY",
        alerts_enabled: false,
        store_verdicts_enabled: true,
      });
      expect(mocks.toast).toHaveBeenCalledWith(
        failure
          ? {
              title: "更新通知设置时出错",
              description: "NOTIFY_E409: original error",
              variant: "destructive",
            }
          : { title: "通知偏好设置已更新" },
      );
    },
  );

  test.each([
    {
      locale: "zh-CN" as const,
      failure: false,
      title: "成功",
      description: "你的时区已更新。",
    },
    {
      locale: "zh-CN" as const,
      failure: true,
      title: "错误",
      description: "更新时区失败，请重试。",
    },
    {
      locale: "en" as const,
      failure: false,
      title: "Success",
      description: "Your timezone has been updated successfully.",
    },
  ])(
    "localizes legacy timezone save in $locale (failure=$failure) without changing the timezone ID",
    async ({ locale, failure, title, description }) => {
      let body: unknown;
      server.use(
        http.post("*/api/auth/user/timezone", async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(
            failure
              ? { detail: "original error" }
              : { timezone: "Asia/Shanghai" },
            { status: failure ? 400 : 200 },
          );
        }),
      );
      const { result } = renderHook(
        () =>
          useTimezoneForm({
            currentTimezone: "UTC",
            user: {
              id: "user-1",
              email: "current@example.com",
              user_metadata: {},
            },
          }),
        { wrapper: makeWrapper(locale) },
      );
      await act(async () =>
        result.current.onSubmit({ timezone: "Asia/Shanghai" }),
      );
      expect(body).toEqual({ timezone: "Asia/Shanghai" });
      expect(mocks.toast).toHaveBeenCalledWith({
        title,
        description,
        variant: failure ? "destructive" : "success",
      });
    },
  );

  test("localizes legacy timezone validation", async () => {
    const { result } = renderHook(
      () =>
        useTimezoneForm({
          currentTimezone: "",
          user: {
            id: "user-1",
            email: "current@example.com",
            user_metadata: {},
          },
        }),
      { wrapper: makeWrapper() },
    );
    await act(async () => {
      expect(await result.current.form.trigger("timezone")).toBe(false);
    });
    expect(result.current.form.getFieldState("timezone").error?.message).toBe(
      "请选择时区",
    );
  });

  test.each(["zh-CN", "en"] as const)(
    "localizes timezone detection in %s without translating the detected ID or repeating the update",
    async (locale) => {
      const options = new Intl.DateTimeFormat().resolvedOptions();
      const resolvedOptions = vi
        .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
        .mockReturnValue({ ...options, timeZone: "Asia/Shanghai" });
      const updates: unknown[] = [];
      server.use(
        http.post("*/api/auth/user/timezone", async ({ request }) => {
          updates.push(await request.json());
          return HttpResponse.json({ timezone: "Asia/Shanghai" });
        }),
      );
      try {
        const { rerender } = renderHook(() => useTimezoneDetection("not-set"), {
          wrapper: makeWrapper(locale),
        });
        await waitFor(() =>
          expect(updates).toEqual([{ timezone: "Asia/Shanghai" }]),
        );
        await waitFor(() =>
          expect(mocks.toast).toHaveBeenCalledWith({
            title: locale === "zh-CN" ? "已检测到时区" : "Timezone detected",
            description:
              locale === "zh-CN"
                ? "已将你的时区设为 Asia/Shanghai。你可以在设置中更改。"
                : "We've set your timezone to Asia/Shanghai. You can change this in settings.",
            variant: "success",
          }),
        );
        rerender();
        expect(updates).toHaveLength(1);
        expect(mocks.toast).toHaveBeenCalledTimes(1);
      } finally {
        resolvedOptions.mockRestore();
      }
    },
  );
});
