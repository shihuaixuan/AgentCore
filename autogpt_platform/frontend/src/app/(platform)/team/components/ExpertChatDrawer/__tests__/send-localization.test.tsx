import type { OutgoingMessage } from "@/app/(platform)/copilot/helpers/sendWithAttachments";
import { useCopilotUIStore } from "@/app/(platform)/copilot/store";
import { toast } from "@/components/molecules/Toast/use-toast";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { recoverUnsentMessage } from "../useExpertChatSend";

vi.mock("@/components/molecules/Toast/use-toast", () => ({ toast: vi.fn() }));

const message: OutgoingMessage = {
  text: "Original 自定义 message",
  files: [],
  parts: [],
};

beforeEach(() => {
  vi.mocked(toast).mockClear();
  useCopilotUIStore.getState().clearRecoveredDraft();
});

afterEach(() => {
  useCopilotUIStore.getState().clearRecoveredDraft();
});

describe("drawer send failure localization", () => {
  test("localizes message recovery while restoring the original draft", () => {
    recoverUnsentMessage(message, null, "zh-CN");
    expect(vi.mocked(toast).mock.calls[0][0]).toMatchObject({
      title: "无法发送消息",
      description: "你的消息已返回输入框。请重试。",
    });
    expect(useCopilotUIStore.getState().recoveredDraft).toBe(message.text);
  });

  test("localizes file recovery without translating raw errors", () => {
    recoverUnsentMessage(
      { ...message, text: "" },
      new Error("Original server error"),
      "zh-CN",
    );
    expect(vi.mocked(toast).mock.calls[0][0]).toMatchObject({
      title: "无法发送消息",
      description: "Original server error — 你的文件尚未发送。",
    });
  });

  test("passes the locale through to plan failure handling", () => {
    recoverUnsentMessage(
      message,
      new ApiError("Payment required", 402, {}),
      "zh-CN",
    );
    expect(vi.mocked(toast).mock.calls[0][0]).toMatchObject({
      title: "发送消息需要有效套餐",
    });
  });

  test("keeps English recovery when no locale is supplied", () => {
    recoverUnsentMessage(message, null);
    expect(vi.mocked(toast).mock.calls[0][0]).toMatchObject({
      title: "Couldn't send message",
      description: "Your message is back in the composer. Try again.",
    });
  });
});
