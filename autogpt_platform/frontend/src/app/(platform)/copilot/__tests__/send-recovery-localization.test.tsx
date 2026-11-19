import { useState, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, test, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useChatInput } from "../components/ChatInput/useChatInput";
import { useScheduledSend } from "../components/SendAtReset/useScheduledSend";
import { useCopilotUIStore } from "../store";
import { recoverFailedDeferredSend } from "../useSendMessage";

vi.mock("@/components/molecules/Toast/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({ toast }),
}));

afterEach(() => {
  useCopilotUIStore.getState().setInitialPrompt(null);
  vi.clearAllMocks();
});

test("localizes a rejected send and restores the original user draft", async () => {
  function Composer() {
    const [error] = useState(() => new Error("Raw server error"));
    const composer = useChatInput({
      onSend: () => {
        throw error;
      },
      autoFocus: false,
    });
    return (
      <form onSubmit={composer.handleSubmit}>
        <textarea
          aria-label="Raw draft"
          value={composer.value}
          onChange={composer.handleChange}
        />
        <button type="submit">Send raw</button>
      </form>
    );
  }
  render(
    <LanguageProvider>
      <Composer />
    </LanguageProvider>,
  );
  fireEvent.change(screen.getByLabelText("Raw draft"), {
    target: { value: "Keep original user text" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send raw" }));
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "无法发送消息",
        description: "Raw server error — 你的消息已返回输入框。",
      }),
    ),
  );
  expect(
    (screen.getByLabelText("Raw draft") as HTMLTextAreaElement).value,
  ).toBe("Keep original user text");
});

test("localizes queued send failures and preserves the queued draft", async () => {
  function Composer() {
    const composer = useChatInput({
      onSend: vi.fn(),
      onEnqueue: async () => {
        throw new Error("Raw queue error");
      },
      isStreaming: true,
      autoFocus: false,
    });
    return (
      <form onSubmit={composer.handleSubmit}>
        <textarea
          aria-label="Queued draft"
          value={composer.value}
          onChange={composer.handleChange}
        />
        <button type="submit">Queue raw</button>
      </form>
    );
  }
  render(
    <LanguageProvider initialLocale="zh-CN">
      <Composer />
    </LanguageProvider>,
  );
  fireEvent.change(screen.getByLabelText("Queued draft"), {
    target: { value: "Keep queued English text" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Queue raw" }));
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "无法发送消息",
        description: "Raw queue error — 你的消息已返回输入框。",
      }),
    ),
  );
  expect(
    (screen.getByLabelText("Queued draft") as HTMLTextAreaElement).value,
  ).toBe("Keep queued English text");
});

test("localizes deferred send recovery without changing the restored draft", () => {
  recoverFailedDeferredSend(
    "Raw deferred draft",
    [],
    new Error("Raw response"),
    "zh-CN",
  );
  expect(useCopilotUIStore.getState().initialPrompt).toBe("Raw deferred draft");
  expect(toast).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "无法发送消息",
      description: "Raw response — 你的消息已返回输入框。",
    }),
  );
});

test("localizes schedule failures from the real scheduled send hook", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <LanguageProvider initialLocale="zh-CN">{children}</LanguageProvider>
      </QueryClientProvider>
    );
  }
  const { result, unmount } = renderHook(
    () => useScheduledSend({ sessionId: null }),
    { wrapper: Wrapper },
  );
  try {
    await act(async () =>
      result.current.scheduleQuietly("Raw scheduled draft"),
    );
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "无法安排消息发送",
        description: "此对话尚未准备好 — 你的消息已返回输入框。",
      }),
    );
  } finally {
    unmount();
    client.clear();
  }
});
