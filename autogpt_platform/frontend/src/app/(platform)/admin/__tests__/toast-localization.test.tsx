import type { AccountIPReport } from "@/app/api/__generated__/models/accountIPReport";
import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { server } from "@/mocks/mock-server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useSelectionBar } from "../../artifacts/components/ArtifactsList/SelectionBar/useSelectionBar";
import { useExpertChatDrawer } from "../../team/components/ExpertChatDrawer/useExpertChatDrawer";
import { useExpertComputerSection } from "../../team/[expertId]/components/ExpertComputerSection/useExpertComputerSection";
import { useMemoryVisualizer } from "../memory/components/useMemoryVisualizer";
import type { AdminUser } from "../users/helpers";
import { useBanAllDialog } from "../users/components/AccessDialogs/BanAllDialog/useBanAllDialog";
import { useBlockDomainDialog } from "../users/components/AccessDialogs/BlockDomainDialog/useBlockDomainDialog";
import { partialBanFailure } from "../users/components/AccessDialogs/helpers";
import { useBlockSubmit } from "../users/components/AccessDialogs/useBlockSubmit";
import * as accessBlocks from "../users/useAccessBlocks";

const { toastMock } = vi.hoisted(() => ({ toastMock: vi.fn() }));
vi.mock("@/components/molecules/Toast/use-toast", () => ({
  toast: toastMock,
  useToast: () => ({ toast: toastMock }),
}));
vi.mock("@/app/(platform)/copilot/useCopilotStream", () => ({
  useCopilotStream: () => ({
    messages: [],
    setMessages: vi.fn(),
    sendMessage: vi.fn(),
    stop: vi.fn(),
    status: "ready",
    isReconnecting: false,
    isFinishProbing: false,
  }),
}));

function wrapper(locale?: Locale) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Providers({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>
        <NuqsTestingAdapter>
          {locale ? (
            <LanguageProvider initialLocale={locale}>
              {children}
            </LanguageProvider>
          ) : (
            children
          )}
        </NuqsTestingAdapter>
      </QueryClientProvider>
    );
  };
}

const user: AdminUser = {
  id: "original-user",
  email: "Original@example.com",
  name: "Original Name",
  image: null,
  role: "user",
  emailVerified: true,
  createdAt: new Date(2026, 0, 1),
  banned: false,
  banReason: null,
  banExpires: null,
};
const report: AccountIPReport = {
  retention_days: 90,
  ips: [],
  related_total: 1,
  domain: {
    value: "Original.example",
    is_public_provider: false,
    other_account_count: 1,
    block: null,
  },
  related: [
    {
      id: "original-related",
      email: "Related@Original.example",
      name: "Original Related",
      role: "user",
      created_at: new Date(2026, 0, 1),
      banned: false,
      ban_expires: null,
      has_profile: true,
      via_ips: [],
      via_domain: true,
      plan: null,
      payment_status: "no_subscription",
    },
  ],
};
const files: WorkspaceFileItem[] = ["Original One.txt", "Original Two.txt"].map(
  (name, index) => ({
    id: `original-file-${index}`,
    name,
    path: `/${name}`,
    mime_type: "text/plain",
    size_bytes: 10,
    origin: "uploaded",
    created_at: "2026-11-01T00:00:00Z",
  }),
);

beforeEach(() => {
  toastMock.mockReset();
  server.use(
    http.post("*/api/admin/ban-accounts", async ({ request }) => {
      const { userIds } = (await request.json()) as { userIds: string[] };
      return HttpResponse.json({
        results: userIds.map((userId) => ({ userId, ok: true })),
      });
    }),
    http.post("*/api/admin/access-blocks", () =>
      HttpResponse.json({ id: "original-block" }, { status: 201 }),
    ),
    http.get("*/api/admin/memory/:userId/overview", () =>
      HttpResponse.json({ expert_id: null }),
    ),
    http.get("*/api/admin/memory/:userId/graph", () =>
      HttpResponse.json({ expert_id: null, nodes: [], edges: [] }),
    ),
    http.delete("*/api/workspace/files/:fileId", () =>
      HttpResponse.json({ success: true }),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("localizes partial-ban summaries while preserving raw errors and English defaults", () => {
  expect(
    partialBanFailure(3, 1, ["Original API error"], "zh-CN"),
  ).toMatchObject({
    title: "已封禁 3 个账户中的 2 个",
    description: "1 个失败；具体账户已在对话框中标出。 Original API error",
  });
  expect(partialBanFailure(3, 1)).toMatchObject({
    title: "Banned 2 of 3 accounts",
    description: "1 failed; the dialog shows which.",
  });
});

describe.each(["zh-CN", undefined] as const)("%s toast locale", (locale) => {
  const zh = locale === "zh-CN";

  test("localizes file-delete confirmations, counts and partial failures without changing names", async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal("confirm", confirm);
    const done = vi.fn();
    const { result, rerender } = renderHook(
      ({ selected }) => useSelectionBar(selected, done),
      {
        wrapper: wrapper(locale),
        initialProps: { selected: files },
      },
    );
    expect(result.current.moveSubject).toBe(zh ? "2 个文件" : "2 files");
    await act(() => result.current.handleDelete());
    expect(confirm).toHaveBeenCalledWith(
      zh ? "删除 2 个文件？" : "Delete 2 files?",
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: zh ? "已删除 2 个文件" : "2 files deleted",
      }),
    );
    rerender({ selected: files.slice(0, 1) });
    await act(() => result.current.handleDelete());
    expect(confirm).toHaveBeenLastCalledWith(
      zh ? "删除“Original One.txt”？" : 'Delete "Original One.txt"?',
    );
    server.use(
      http.delete("*/api/workspace/files/:fileId", () =>
        HttpResponse.json({ detail: "Original error" }, { status: 500 }),
      ),
    );
    await act(() => result.current.handleDelete());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: zh ? "无法删除文件" : "Failed to delete files",
        description: zh
          ? "1 个文件中有 1 个无法删除。"
          : "1 of 1 files could not be deleted.",
      }),
    );
  });

  test("localizes bulk ban success and its session warning", async () => {
    const { result } = renderHook(
      () => useBanAllDialog({ user, report, signedInUserId: undefined }),
      { wrapper: wrapper(locale) },
    );
    act(() => result.current.handleOpenChange(true));
    await act(() => result.current.submit());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: zh ? "已封禁 1 个账户" : "Banned 1 account",
      }),
    );
    const notification = toastMock.mock.calls.at(-1)?.[0];
    expect(notification.description).toContain(
      zh ? "其会话已退出" : "Their sessions are signed out",
    );
  });

  test("localizes block-only bulk success without translating the domain", async () => {
    const { result } = renderHook(
      () => useBanAllDialog({ user, report, signedInUserId: undefined }),
      { wrapper: wrapper(locale) },
    );
    act(() => {
      result.current.handleOpenChange(true);
    });
    act(() => {
      result.current.toggleAccount(user.id);
      result.current.toggleBlock("EMAIL_DOMAIN:Original.example");
    });
    await act(() => result.current.submit());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: zh ? "已阻止 Original.example" : "Blocked Original.example",
      }),
    );
  });

  test("localizes ban failures without replacing API error details", async () => {
    server.use(
      http.post("*/api/admin/ban-accounts", () =>
        HttpResponse.json({ error: "Original ban error" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(
      () => useBanAllDialog({ user, report, signedInUserId: undefined }),
      { wrapper: wrapper(locale) },
    );
    act(() => result.current.handleOpenChange(true));
    await act(() => result.current.submit());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: zh ? "无法封禁这些账户" : "Couldn't ban the accounts",
        description: "Original ban error",
      }),
    );
  });

  test("passes the locale into partial-ban notifications in both dialogs", async () => {
    server.use(
      http.post("*/api/admin/ban-accounts", async ({ request }) => {
        const { userIds } = (await request.json()) as { userIds: string[] };
        return HttpResponse.json({
          results: userIds.map((userId) => ({
            userId,
            ok: false,
            error: "Original ban error",
          })),
        });
      }),
    );
    const bulk = renderHook(
      () => useBanAllDialog({ user, report, signedInUserId: undefined }),
      { wrapper: wrapper(locale) },
    );
    act(() => bulk.result.current.handleOpenChange(true));
    await act(() => bulk.result.current.submit());
    expect(toastMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: zh ? "已封禁 1 个账户中的 0 个" : "Banned 0 of 1 account",
        description: zh
          ? "1 个失败；具体账户已在对话框中标出。"
          : "1 failed; the dialog shows which.",
      }),
    );
    bulk.unmount();
    const domain = renderHook(
      () =>
        useBlockDomainDialog({
          report,
          signedInUserId: undefined,
          submitBlock: async () => true,
          viewBlocksAction: null,
        }),
      { wrapper: wrapper(locale) },
    );
    act(() => domain.result.current.handleOpenChange(true));
    act(() => domain.result.current.setAlsoBan(true));
    await act(() => domain.result.current.submit());
    expect(toastMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: zh ? "已封禁 1 个账户中的 0 个" : "Banned 0 of 1 account",
      }),
    );
  });

  test("localizes unknown block failures while leaving the caller's title intact", async () => {
    vi.spyOn(accessBlocks, "useAccessBlocks").mockReturnValue({
      createBlock: vi.fn().mockRejectedValue(null),
      deleteBlock: vi.fn(),
      isCreating: false,
      isDeleting: false,
    });
    const { result } = renderHook(() => useBlockSubmit(), {
      wrapper: wrapper(locale),
    });
    await act(async () => {
      await result.current.submitBlock({
        kind: "IP",
        value: "203.0.113.9",
        reason: "Original reason",
        expiresAt: null,
        failureTitle: "Original title",
      });
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Original title",
        description: zh ? "出了点问题。" : "Something went wrong.",
      }),
    );
  });

  test("localizes domain block and ban success while keeping domain data unchanged", async () => {
    const submitBlock = vi.fn(async () => true);
    const { result } = renderHook(
      () =>
        useBlockDomainDialog({
          report,
          signedInUserId: undefined,
          submitBlock,
          viewBlocksAction: null,
        }),
      { wrapper: wrapper(locale) },
    );
    act(() => result.current.handleOpenChange(true));
    await act(() => result.current.submit());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: zh ? "已阻止 Original.example" : "Blocked Original.example",
        description: zh ? "该域名无法再注册新账户。" : "No new sign-ups on it.",
      }),
    );
    expect(submitBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "Original.example",
        failureTitle: zh ? "无法阻止该域名" : "Couldn't block the domain",
      }),
    );
    act(() => {
      result.current.handleOpenChange(true);
      result.current.setAlsoBan(true);
    });
    await act(() => result.current.submit());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: zh
          ? "已阻止 Original.example，并封禁 1 个账户"
          : "Blocked Original.example and banned 1 account",
      }),
    );
  });

  test("localizes chat startup failure and passes the locale into error guidance", async () => {
    server.use(
      http.post("*/api/chat/sessions", () =>
        HttpResponse.json(
          { detail: "Original startup error" },
          { status: 500 },
        ),
      ),
    );
    const { result } = renderHook(
      () =>
        useExpertChatDrawer({
          target: {
            expertId: null,
            role: "Original Role",
            avatarUrl: null,
          },
          isOpen: true,
          resumeLatest: false,
          threadKey: 0,
          seedPrompt: null,
        }),
      { wrapper: wrapper(locale) },
    );
    await act(async () => {
      await expect(
        result.current.onActionSend("Original message"),
      ).rejects.toBeDefined();
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: zh ? "无法启动聊天" : "Could not start the chat",
      }),
    );
    expect(toastMock.mock.calls.at(-1)?.[0].description).toMatch(
      zh ? /[\u4e00-\u9fff]/ : /The server had a problem/,
    );
  });

  test.each([
    {
      action: "triggerRebuild" as const,
      endpoint: "communities/rebuild",
      en: "Rebuild failed to schedule",
      cn: "无法安排重建任务",
    },
    {
      action: "triggerDream" as const,
      endpoint: "dream",
      en: "Dream pass failed to schedule",
      cn: "无法安排记忆整理任务",
    },
    {
      action: "triggerNightly" as const,
      endpoint: "nightly",
      en: "Nightly batch failed to schedule",
      cn: "无法安排夜间批处理",
    },
  ])(
    "localizes $action scheduling failures but preserves the server message",
    async ({ action, endpoint, en, cn }) => {
      server.use(
        http.post(`*/api/admin/memory/:userId/${endpoint}`, () =>
          HttpResponse.json(
            { detail: "Original server error" },
            { status: 503 },
          ),
        ),
      );
      const { result } = renderHook(() => useMemoryVisualizer(), {
        wrapper: wrapper(locale),
      });
      act(() => result.current[action]());
      await waitFor(() =>
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: zh ? cn : en,
            description: "Original server error",
          }),
        ),
      );
    },
  );

  test("localizes completed memory-job summaries while preserving JSON keys and counts", async () => {
    server.use(
      http.post("*/api/admin/memory/:userId/dream", () =>
        HttpResponse.json({ job_id: "original-job" }, { status: 202 }),
      ),
      http.get("*/api/admin/memory/:userId/dream/:jobId", () =>
        HttpResponse.json({
          state: "complete",
          result: {
            consolidated_count: 2,
            proposal_count: 1,
            demotion_count: 0,
            communities_built: { "Original key": 3 },
            elapsed_seconds: 1.2,
            dream_in_flight: true,
          },
        }),
      ),
    );
    const { result } = renderHook(() => useMemoryVisualizer(), {
      wrapper: wrapper(locale),
    });
    act(() => result.current.triggerDream());
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: zh ? "记忆整理已完成" : "Dream pass complete",
        }),
      ),
    );
    expect(toastMock.mock.calls.at(-1)?.[0].description).toBe(
      zh
        ? '写入=2 — 提案=1 — 降级=0 — 社区={"Original key":3} — 1.2 秒 — 记忆应用仍在进行中，统计将随记忆整理任务异步更新'
        : 'writes=2 — proposals=1 — demotions=0 — communities={"Original key":3} — 1.2s — dream apply still in flight — counts land async via the dream pass job',
    );
  });

  test.each(["errored", "query-error"])(
    "localizes %s job notifications without translating backend errors",
    async (state) => {
      server.use(
        http.post("*/api/admin/memory/:userId/dream", () =>
          HttpResponse.json({ job_id: "original-job" }, { status: 202 }),
        ),
        http.get("*/api/admin/memory/:userId/dream/:jobId", () =>
          state === "query-error"
            ? HttpResponse.json(
                { detail: "Original query error" },
                { status: 500 },
              )
            : HttpResponse.json({ state, error: "Original job error" }),
        ),
      );
      const { result } = renderHook(() => useMemoryVisualizer(), {
        wrapper: wrapper(locale),
      });
      act(() => result.current.triggerDream());
      await waitFor(() =>
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title:
              state === "query-error"
                ? zh
                  ? "无法获取记忆整理状态"
                  : "Dream pass status unavailable"
                : zh
                  ? "记忆整理失败"
                  : "Dream pass failed",
            description:
              state === "query-error"
                ? "Original query error"
                : "Original job error",
          }),
        ),
      );
      await waitFor(() =>
        expect(result.current.activeDreamJobId).toBeUndefined(),
      );
    },
  );

  test("localizes ratification summaries and memory-scope mismatch notifications", async () => {
    server.use(
      http.post("*/api/admin/memory/:userId/ratification", () =>
        HttpResponse.json({
          examined_count: 3,
          ratified_count: 2,
          superseded_count: 1,
        }),
      ),
    );
    const { result } = renderHook(() => useMemoryVisualizer(), {
      wrapper: wrapper(locale),
    });
    act(() => result.current.triggerRatification());
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: zh ? "确认已完成" : "Ratification complete",
          description: zh
            ? "已检查=3，已确认=2，已替代=1"
            : "examined=3, ratified=2, superseded=1",
        }),
      ),
    );
    server.use(
      http.get("*/api/admin/memory/:userId/overview", () =>
        HttpResponse.json({ expert_id: "original-other-expert" }),
      ),
    );
    await act(async () => {
      await result.current.overview.refetch();
    });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: zh ? "记忆范围不匹配" : "Memory scope mismatch",
          description: zh
            ? "服务器返回的记忆范围与请求不一致，未显示这些不匹配的数据。"
            : "The server returned memory for a different scope than requested. The mismatched data was not rendered.",
        }),
      ),
    );
  });

  test.each([false, true])(
    "localizes ratification failure with transport error=%s while preserving backend text",
    async (transportError) => {
      server.use(
        http.post("*/api/admin/memory/:userId/ratification", () =>
          HttpResponse.json(
            transportError
              ? { detail: "Original ratification error" }
              : { error: "Original ratification error" },
            { status: transportError ? 500 : 200 },
          ),
        ),
      );
      const { result } = renderHook(() => useMemoryVisualizer(), {
        wrapper: wrapper(locale),
      });
      act(() => result.current.triggerRatification());
      await waitFor(() =>
        expect(toastMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: zh ? "确认失败" : "Ratification failed",
            description: "Original ratification error",
          }),
        ),
      );
    },
  );

  test("localizes desktop startup fallback while preserving API failure text", async () => {
    server.use(
      http.get("*/api/experts/:expertId/computer", () =>
        HttpResponse.json(null),
      ),
      http.post("*/api/experts/:expertId/computer/desktop", () =>
        HttpResponse.json(
          { detail: "Original desktop error" },
          { status: 500 },
        ),
      ),
    );
    const { result } = renderHook(
      () => useExpertComputerSection({ expertId: "original-expert" }),
      { wrapper: wrapper(locale) },
    );
    act(() => result.current.openDesktop());
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: zh ? "无法打开桌面" : "Could not open the desktop",
          description: zh
            ? "沙盒未能启动，请稍后重试。"
            : "The sandbox did not come up. Try again in a moment.",
        }),
      ),
    );
    server.use(
      http.post("*/api/experts/:expertId/computer/desktop", () =>
        HttpResponse.json(
          { detail: "Original rate-limit error" },
          { status: 429 },
        ),
      ),
    );
    act(() => result.current.openDesktop());
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Original rate-limit error" }),
      ),
    );
  });
});
