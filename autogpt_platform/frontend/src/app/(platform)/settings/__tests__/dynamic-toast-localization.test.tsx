import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getGetV1GetNotificationPreferencesMockHandler,
  getGetV1GetUserTimezoneMockHandler,
  getPostV1UpdateNotificationPreferencesMockHandler,
  getPostV1UpdateUserTimezoneMockHandler,
} from "@/app/api/__generated__/endpoints/auth/auth.msw";
import type { StoreSubmission } from "@/app/api/__generated__/models/storeSubmission";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { server } from "@/mocks/mock-server";
import { usePreferencesPage } from "../account/usePreferencesPage";
import { describeFooterChoice } from "../account/helpers";
import { useAccountCard } from "../account/components/AccountCard/useAccountCard";
import { useRevokeAPIKey } from "../api-keys/components/hooks/useRevokeAPIKey";
import { CreateAPIKeySuccess } from "../api-keys/components/CreateAPIKeyDialog/components/CreateAPIKeySuccess";
import { useSubmissionItem } from "../creator-dashboard/components/SubmissionItem/useSubmissionItem";
import { buildEditPayload } from "../creator-dashboard/helpers";

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

vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "current@example.com", user_metadata: {} },
  }),
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useSearchParams: () => mocks.searchParams,
  usePathname: () => "/settings/account",
  useRouter: () => ({ replace: mocks.replace }),
}));

const clients: QueryClient[] = [];
const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const preferences = {
  user_id: "user-1",
  email: "current@example.com",
  briefing_frequency: "WEEKLY" as const,
  alerts_enabled: true,
  store_verdicts_enabled: true,
  daily_limit: 0,
};
const submission: StoreSubmission = {
  listing_id: "listing-1",
  user_id: "user-1",
  slug: "my-workflow",
  listing_version_id: "version-1",
  listing_version: 1,
  graph_id: "graph-1",
  graph_version: 1,
  name: "My workflow",
  sub_heading: "My summary",
  description: "Original description",
  instructions: null,
  categories: [],
  image_urls: [],
  video_url: null,
  agent_output_demo_url: null,
  submitted_at: null,
  changes_summary: null,
  status: "PENDING",
  run_count: 12,
  review_count: 0,
  review_avg_rating: 0,
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
    getGetV1GetNotificationPreferencesMockHandler(preferences),
    getGetV1GetUserTimezoneMockHandler({ timezone: "Asia/Shanghai" }),
    getPostV1UpdateNotificationPreferencesMockHandler(preferences),
    getPostV1UpdateUserTimezoneMockHandler({ timezone: "Europe/London" }),
  );
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  if (originalClipboard)
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

describe("settings dynamic notification localization", () => {
  test.each([
    ["daily", "你将每天收到简报"],
    ["weekly", "你将每周收到简报"],
    ["monthly", "你将每月收到简报"],
    ["alerts", "简报已暂停，你仍会收到提醒"],
    ["off", "简报和提醒已暂停"],
    [null, "偏好设置已更新"],
  ])(
    "localizes footer confirmation for %s with English defaults intact",
    (choice, expected) => {
      expect(describeFooterChoice(choice, "zh-CN")).toBe(expected);
      expect(describeFooterChoice(choice)).toBe(
        describeFooterChoice(choice, "en"),
      );
      expect(describeFooterChoice(null)).toBe("Preferences updated");
    },
  );

  test("passes locale to signed footer confirmation and applies it once", async () => {
    mocks.searchParams = new URLSearchParams({ f: "daily", t: "signed-token" });
    let applications = 0;
    server.use(
      http.post("*/api/auth/user/preferences/from-email", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("choice")).toBe("daily");
        expect(url.searchParams.get("token")).toBe("signed-token");
        applications += 1;
        return HttpResponse.json({
          ...preferences,
          briefing_frequency: "DAILY",
        });
      }),
    );
    const { rerender } = renderHook(usePreferencesPage, {
      wrapper: makeWrapper(),
    });
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "你将每天收到简报",
        variant: "success",
      }),
    );
    rerender();
    expect(applications).toBe(1);
    expect(mocks.replace).toHaveBeenCalledWith("/settings/account");
  });

  test("localizes signed footer failure without losing the selected choice", async () => {
    mocks.searchParams = new URLSearchParams({
      f: "daily",
      t: "expired-token",
    });
    server.use(
      http.post("*/api/auth/user/preferences/from-email", () =>
        HttpResponse.json({ detail: "expired" }, { status: 400 }),
      ),
    );
    const { result } = renderHook(usePreferencesPage, {
      wrapper: makeWrapper(),
    });
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "无法更新邮件频率",
        description: "你的选择已在下方选中，请点击保存以重试。",
        variant: "destructive",
      }),
    );
    expect(result.current.formState.notifications.briefingFrequency).toBe(
      "DAILY",
    );
  });

  test.each(["zh-CN", "en"] as const)(
    "localizes a successful preferences save in %s",
    async (locale) => {
      const { result } = renderHook(usePreferencesPage, {
        wrapper: makeWrapper(locale),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.setTimezone("Europe/London"));
      await act(async () => result.current.savePreferences());
      expect(mocks.toast).toHaveBeenCalledWith({
        title: locale === "zh-CN" ? "偏好设置已保存" : "Preferences saved",
        variant: "success",
      });
    },
  );

  test.each([true, false])(
    "localizes preferences failure (partial=%s) and retains backend error details",
    async (partial) => {
      server.use(
        http.post("*/api/auth/user/timezone", () =>
          HttpResponse.json(
            { detail: "TZ_POLICY: original error" },
            { status: 400 },
          ),
        ),
      );
      if (!partial)
        server.use(
          http.post("*/api/auth/user/preferences", () =>
            HttpResponse.json(
              { detail: "NOTIFY_POLICY: original error" },
              { status: 400 },
            ),
          ),
        );
      const { result } = renderHook(usePreferencesPage, {
        wrapper: makeWrapper(),
      });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => {
        result.current.setTimezone("Europe/London");
        result.current.setAlertsEnabled(false);
      });
      await act(async () => result.current.savePreferences());
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: partial ? "偏好设置已部分保存" : "无法保存偏好设置",
          description: expect.stringContaining(
            "时区：TZ_POLICY: original error",
          ),
          variant: "destructive",
        }),
      );
      if (!partial)
        expect(mocks.toast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: expect.stringContaining(
              "通知：NOTIFY_POLICY: original error",
            ),
          }),
        );
    },
  );

  test.each([true, false])(
    "localizes email success (verified=%s) without changing the address",
    async (verified) => {
      let body: unknown;
      server.use(
        http.put("*/api/auth/user", async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ ok: true });
        }),
      );
      const { result } = renderHook(
        () =>
          useAccountCard({
            user: {
              id: "user-1",
              email: "current@example.com",
              email_verified: verified,
              user_metadata: {},
            },
          }),
        { wrapper: makeWrapper() },
      );
      await act(async () => {
        await result.current.onSubmitEmail({
          email: "New.Address@example.com",
        });
      });
      expect(body).toEqual({ email: "New.Address@example.com" });
      expect(mocks.toast).toHaveBeenCalledWith({
        title: verified ? "请确认新邮箱" : "邮箱已更新",
        description: verified
          ? "我们已向你当前的邮箱发送确认链接。点击链接后，邮箱地址才会更改。"
          : "你的邮箱现已更改为 New.Address@example.com。",
        variant: "success",
      });
      expect(result.current.emailForm.getValues("email")).toBe(
        "current@example.com",
      );
    },
  );

  test.each([
    [{ error: "AUTH_E409: original error" }, "AUTH_E409: original error"],
    [{}, "无法更新邮箱"],
  ])(
    "localizes email failure fallback but preserves provider messages",
    async (response, description) => {
      server.use(
        http.put("*/api/auth/user", () =>
          HttpResponse.json(response, { status: 400 }),
        ),
      );
      const { result } = renderHook(
        () =>
          useAccountCard({
            user: {
              id: "user-1",
              email: "current@example.com",
              user_metadata: {},
            },
          }),
        { wrapper: makeWrapper() },
      );
      await act(async () => {
        expect(
          await result.current.onSubmitEmail({ email: "new@example.com" }),
        ).toBe(false);
      });
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "无法更新邮箱",
        description,
        variant: "destructive",
      });
    },
  );

  test.each([
    ["", "请输入邮箱"],
    ["not-an-email", "请输入有效的邮箱地址"],
  ])("localizes email validation for %s", async (email, message) => {
    const { result } = renderHook(
      () =>
        useAccountCard({
          user: {
            id: "user-1",
            email: "current@example.com",
            user_metadata: {},
          },
        }),
      { wrapper: makeWrapper() },
    );
    act(() => result.current.emailForm.setValue("email", email));
    await act(async () => {
      expect(await result.current.emailForm.trigger("email")).toBe(false);
    });
    expect(result.current.emailForm.getFieldState("email").error?.message).toBe(
      message,
    );
  });

  test.each([
    {
      locale: "zh-CN" as const,
      ids: ["key-a"],
      failing: "",
      title: "API 密钥已撤销",
      description: undefined,
    },
    {
      locale: "zh-CN" as const,
      ids: ["key-a", "key-b"],
      failing: "",
      title: "已撤销 2 个 API 密钥",
      description: undefined,
    },
    {
      locale: "zh-CN" as const,
      ids: ["key-a", "key-b"],
      failing: "key-b",
      title: "部分 API 密钥无法撤销",
      description: "2 个密钥中有 1 个撤销失败。",
    },
    {
      locale: "en" as const,
      ids: ["key-a", "key-b"],
      failing: "key-b",
      title: "Some API keys could not be revoked",
      description: "1 of 2 failed.",
    },
  ])(
    "localizes API revocation counts in $locale without changing IDs",
    async ({ locale, ids, failing, title, description }) => {
      const requested: string[] = [];
      server.use(
        http.delete("*/api/api-keys/:keyId", ({ params }) => {
          requested.push(String(params.keyId));
          return HttpResponse.json(
            params.keyId === failing ? { detail: "Original error" } : {},
            { status: params.keyId === failing ? 400 : 200 },
          );
        }),
      );
      const { result } = renderHook(useRevokeAPIKey, {
        wrapper: makeWrapper(locale),
      });
      await act(async () => {
        expect(await result.current.revoke(ids)).toBe(!failing);
      });
      expect(requested.sort()).toEqual([...ids].sort());
      expect(mocks.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title,
          ...(description ? { description } : {}),
          variant: failing ? "destructive" : "success",
        }),
      );
    },
  );

  test.each([false, true])(
    "localizes clipboard result (failure=%s) and keeps the key private and unaltered",
    async (failure) => {
      const writeText = failure
        ? vi.fn().mockRejectedValue(new Error("denied"))
        : vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
      render(
        <LanguageProvider initialLocale="zh-CN">
          <CreateAPIKeySuccess
            plainTextKey="agpt_raw_SECRET-AbC123"
            onClose={vi.fn()}
          />
        </LanguageProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "复制" }));
      await waitFor(() =>
        expect(mocks.toast).toHaveBeenCalledWith(
          failure
            ? {
                title: "无法复制到剪贴板",
                description: "请手动复制密钥。",
                variant: "destructive",
              }
            : { title: "已复制到剪贴板", variant: "success" },
        ),
      );
      expect(writeText).toHaveBeenCalledWith("agpt_raw_SECRET-AbC123");
      expect(
        screen.getByText("agpt_raw_SECRET-AbC123").closest(".ph-no-capture"),
      ).not.toBeNull();
    },
  );

  test("localizes submission edit defaults but preserves author summaries", () => {
    expect(buildEditPayload(submission, "zh-CN").changes_summary).toBe(
      "更新提交",
    );
    expect(buildEditPayload(submission).changes_summary).toBe(
      "Update Submission",
    );
    expect(
      buildEditPayload(
        { ...submission, changes_summary: "My custom changes" },
        "zh-CN",
      ).changes_summary,
    ).toBe("My custom changes");
    const onEdit = vi.fn();
    const { result } = renderHook(
      () =>
        useSubmissionItem({
          submission,
          onView: vi.fn(),
          onEdit,
          onDelete: vi.fn(),
        }),
      { wrapper: makeWrapper() },
    );
    act(() => result.current.handleEdit());
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        changes_summary: "更新提交",
        name: "My workflow",
        description: "Original description",
        store_listing_version_id: "version-1",
      }),
    );
  });

  test("localizes submission delete failures and preserves the original error", async () => {
    const onDelete = vi
      .fn()
      .mockRejectedValue(new Error("STORE_E409: original error"));
    const { result } = renderHook(
      () =>
        useSubmissionItem({
          submission,
          onView: vi.fn(),
          onEdit: vi.fn(),
          onDelete,
        }),
      { wrapper: makeWrapper() },
    );
    await act(async () => result.current.handleConfirmDelete());
    expect(onDelete).toHaveBeenCalledWith("version-1");
    expect(mocks.toast).toHaveBeenCalledWith({
      title: "无法删除提交",
      description: "STORE_E409: original error",
      variant: "destructive",
    });
  });
});
