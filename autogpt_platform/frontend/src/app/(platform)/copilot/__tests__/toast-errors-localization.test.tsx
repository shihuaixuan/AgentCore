import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { postV2CancelSessionTask } from "@/app/api/__generated__/endpoints/chat/chat";
import { toast } from "@/components/molecules/Toast/use-toast";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import { render, screen } from "@/tests/integrations/test-utils";
import { ChatErrorBanner } from "../components/ChatMessagesContainer/components/ChatErrorBanner/ChatErrorBanner";
import { useArtifactPanel } from "../components/ArtifactPanel/useArtifactPanel";
import { useArtifactContent } from "../components/ArtifactPanel/components/useArtifactContent";
import { validatePDFBlob } from "../components/ArtifactPanel/components/validatePDFBlob";
import { classifyArtifact } from "../components/ArtifactPanel/helpers";
import { formatResetHint } from "../components/ProviderLimitDialog/helpers";
import { useVoiceRecording } from "../components/ChatInput/useVoiceRecording";
import { handleStreamError } from "../copilotStreamErrorHandlers";
import {
  describeProviderFailure,
  type ProviderFailure,
} from "../providerFailure";
import { useCopilotUIStore } from "../store";
import { useCopilotReconnect } from "../useCopilotReconnect";
import { useCopilotStop } from "../useCopilotStop";

vi.mock("@/components/molecules/Toast/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({ toast }),
}));
vi.mock(
  "@/app/api/__generated__/endpoints/chat/chat",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/app/api/__generated__/endpoints/chat/chat")
    >()),
    postV2CancelSessionTask: vi.fn(),
  }),
);

function Chinese({ children }: { children: ReactNode }) {
  return <LanguageProvider initialLocale="zh-CN">{children}</LanguageProvider>;
}

afterEach(() => {
  useCopilotUIStore.getState().closeArtifactPanel();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

test("localizes real failed-send guidance and preserves diagnostic details", () => {
  render(
    <Chinese>
      <ChatErrorBanner
        error={Object.assign(new Error("Raw auth detail"), { status: 401 })}
      />
    </Chinese>,
  );
  expect(
    screen.getByText("你已退出登录。请重新登录以继续对话。"),
  ).toBeDefined();
  expect(screen.getByRole("link", { name: "登录" })).toBeDefined();
  expect(screen.getByText("Raw auth detail")).toBeDefined();
});

test("localizes stream fallback toasts without translating raw backend details", () => {
  const callbacks = {
    onRateLimit: vi.fn(),
    onReconnect: vi.fn(),
    isUserStoppingRef: { current: false },
    locale: "zh-CN" as const,
  };
  handleStreamError({ ...callbacks, error: new Error("[code:idle_timeout]") });
  expect(toast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: "你的专家停止响应",
      description: "工具调用卡住，导致会话超时。请点击“重试”以恢复。",
    }),
  );
  handleStreamError({
    ...callbacks,
    error: new Error("[code:idle_timeout] Raw tool failure"),
  });
  expect(toast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: "你的专家停止响应",
      description: "Raw tool failure",
    }),
  );
  handleStreamError({ ...callbacks, error: new Error("Unauthorized") });
  expect(toast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: "身份验证失败",
      description: "你的会话可能已过期，请重新登录。",
    }),
  );
});

test("localizes provider failure wrappers while preserving provider messages", () => {
  const failure: ProviderFailure = {
    kind: "auth_expired",
    message: "Raw provider detail",
    authProvider: "codex",
    credentialId: null,
    resetsAt: null,
    retryable: false,
    reconnectFixesIt: true,
  };
  expect(describeProviderFailure(failure, "zh-CN")).toEqual({
    title: "你的连接需要重新登录",
    description: "Raw provider detail",
  });
  expect(describeProviderFailure({ ...failure, message: "" }, "zh-CN")).toEqual(
    {
      title: "你的连接需要重新登录",
      description: "请在设置中重新连接账户，然后再次发送。",
    },
  );
});

test("localizes the real reconnect hook without changing reconnection behavior", () => {
  const { result, unmount } = renderHook(
    () =>
      useCopilotReconnect({
        sessionId: "original-session",
        hasActiveStream: true,
        status: "error",
        hasConnectedThisMountRef: { current: true },
        resumeStreamRef: { current: vi.fn() },
        hasResumedRef: { current: false },
      }),
    { wrapper: Chinese },
  );
  try {
    act(() => result.current.handleReconnect());
    expect(toast).toHaveBeenCalledWith({
      title: "连接已断开",
      description: "正在重新连接…",
    });
  } finally {
    unmount();
  }
});

test.each([
  {
    initialLocale: "en" as const,
    nextLocale: "zh-CN" as const,
    title: "连接超时",
    description: "你的专家可能仍在工作。请刷新页面查看最新进展。",
  },
  {
    initialLocale: "zh-CN" as const,
    nextLocale: "en" as const,
    title: "Connection timed out",
    description:
      "Your expert may still be working. Refresh to check for updates.",
  },
])(
  "uses the latest $nextLocale locale for an already armed reconnect timeout",
  ({ initialLocale, nextLocale, title, description }) => {
    vi.useFakeTimers();
    const resumeStream = vi.fn();
    const args = {
      sessionId: "original-session",
      hasActiveStream: true,
      status: "error" as const,
      hasConnectedThisMountRef: { current: true },
      resumeStreamRef: { current: resumeStream },
      hasResumedRef: { current: false },
    };
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <LanguageProvider initialLocale={initialLocale}>
          {children}
        </LanguageProvider>
      );
    }
    let unmount: (() => void) | undefined;
    try {
      const rendered = renderHook(
        () => {
          const { setLocale } = useTranslation();
          return { ...useCopilotReconnect(args), setLocale };
        },
        { wrapper: Wrapper },
      );
      unmount = rendered.unmount;

      act(() => rendered.result.current.handleReconnect());
      act(() => rendered.result.current.setLocale(nextLocale));
      act(() => vi.advanceTimersByTime(30_000));

      expect(toast).toHaveBeenLastCalledWith({
        title,
        description,
        variant: "destructive",
      });
      expect(resumeStream).toHaveBeenCalledTimes(1);
      expect(args.hasResumedRef.current).toBe(true);
      expect(rendered.result.current.reconnectExhausted).toBe(true);
    } finally {
      unmount?.();
      vi.useRealTimers();
    }
  },
);

test("localizes task cancellation failures from the real stop hook", async () => {
  vi.mocked(postV2CancelSessionTask).mockRejectedValue(
    new Error("Raw cancellation detail"),
  );
  const stopStream = vi.fn();
  const { result } = renderHook(
    () =>
      useCopilotStop({
        sessionId: "original-session",
        stopStream,
        isUserStoppingRef: { current: false },
        setIsUserStopping: vi.fn(),
      }),
    { wrapper: Chinese },
  );
  await act(async () => result.current());
  expect(stopStream).toHaveBeenCalledOnce();
  expect(toast).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "无法停止任务",
      description: "任务可能仍在后台运行。",
    }),
  );
});

test("localizes artifact clipboard failure from the real panel hook", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Raw file error")),
  );
  useCopilotUIStore.getState().openArtifact({
    id: "toast-localization-artifact",
    title: "Original English.md",
    mimeType: "text/markdown",
    sourceUrl: "/raw/file",
    origin: "agent",
  });
  const { result } = renderHook(() => useArtifactPanel(), { wrapper: Chinese });
  await act(async () => result.current.handleCopy());
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "复制失败",
        description: "无法读取文件或访问剪贴板。",
      }),
    ),
  );
});

test("localizes dynamic artifact fetch prefixes without rewriting server details", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Raw backend file error" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
  const { result } = renderHook(
    () =>
      useArtifactContent(
        {
          id: "failed-localized-artifact",
          title: "Original English.md",
          mimeType: "text/markdown",
          sourceUrl: "/raw/file",
          origin: "agent",
        },
        classifyArtifact("text/markdown", "Original English.md"),
      ),
    { wrapper: Chinese },
  );
  await waitFor(() =>
    expect(result.current.error).toBe(
      "获取文件失败：404 Raw backend file error",
    ),
  );
  await expect(
    validatePDFBlob(
      new Blob(["Raw invalid PDF"], { type: "text/plain" }),
      "zh-CN",
    ),
  ).rejects.toThrow("返回的文件不是有效的 PDF");
});

test("localizes the reset hint used by connection recovery", () => {
  const now = Math.floor(Date.now() / 1000);
  expect(formatResetHint(now + 30, "zh-CN")).toBe("将在一分钟内重置。");
  expect(formatResetHint(now + 20 * 60, "zh-CN")).toBe("约 20 分钟后重置。");
});

test("localizes microphone refusal and its toast from the real recording hook", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const original = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi
        .fn()
        .mockRejectedValue(
          new DOMException("Raw permission detail", "NotAllowedError"),
        ),
    },
  });
  try {
    const { result, unmount } = renderHook(
      () => useVoiceRecording({ setValue: vi.fn(), value: "Raw draft" }),
      { wrapper: Chinese },
    );
    await act(async () => result.current.startRecording());
    expect(result.current.error).toBe("麦克风权限被拒绝");
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "录音失败",
        description: "麦克风权限被拒绝",
      }),
    );
    unmount();
  } finally {
    if (original) Object.defineProperty(navigator, "mediaDevices", original);
    else Reflect.deleteProperty(navigator, "mediaDevices");
  }
});
