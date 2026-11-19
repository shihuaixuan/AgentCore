import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { toast } from "@/components/molecules/Toast/use-toast";
import { uploadFileDirect } from "@/lib/direct-upload";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { useCopilotStreamStore } from "../../copilotStreamStore";
import { useSendMessage } from "../../useSendMessage";
import { MAX_ATTACHMENTS } from "../workspaceAttachments";
import { validateAttachments } from "../sendWithAttachments";

vi.mock("@/components/molecules/Toast/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/lib/direct-upload", () => ({ uploadFileDirect: vi.fn() }));

afterEach(() => {
  useCopilotStreamStore.getState().resetAll();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

test("localizes attachment validation while preserving original file names", () => {
  const file = new File(["raw contents"], "Original English.txt");
  expect(
    validateAttachments(
      {
        text: "Raw draft",
        files: Array.from({ length: MAX_ATTACHMENTS + 1 }, () => file),
        parts: [],
      },
      "zh-CN",
    ),
  ).toBe(false);
  expect(toast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: "附件过多",
      description: `每条消息最多可添加 ${MAX_ATTACHMENTS} 个附件。`,
    }),
  );
  Object.defineProperty(file, "size", { value: 101 * 1024 * 1024 });
  expect(
    validateAttachments(
      { text: "Raw draft", files: [file], parts: [] },
      "zh-CN",
    ),
  ).toBe(false);
  expect(toast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: "文件过大",
      description: "Original English.txt 超过 100 MB 限制。",
    }),
  );
  expect(
    validateAttachments({ text: "Raw draft", files: [file], parts: [] }),
  ).toBe(false);
  expect(toast).toHaveBeenLastCalledWith(
    expect.objectContaining({ title: "File too large" }),
  );
});

test("propagates the composer locale to direct upload and upload failure recovery", async () => {
  vi.mocked(uploadFileDirect).mockRejectedValue(
    new Error("Raw upload response"),
  );
  vi.spyOn(console, "error").mockImplementation(() => {});
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  const file = new File(["raw contents"], "Original English.txt");
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LanguageProvider initialLocale="zh-CN">{children}</LanguageProvider>
    );
  }
  const { result } = renderHook(
    () =>
      useSendMessage({
        sessionId: "original-session",
        sendMessage,
        createSession: async () => undefined,
        isUserStoppingRef: { current: false },
      }),
    { wrapper: Wrapper },
  );
  await act(async () => {
    await expect(
      result.current.onSend("Keep raw draft", [file]),
    ).rejects.toThrow("所有文件均上传失败");
  });
  expect(uploadFileDirect).toHaveBeenCalledWith(
    file,
    "original-session",
    "zh-CN",
  );
  expect(toast).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "文件上传失败",
      description: "Original English.txt",
    }),
  );
  expect(toast).toHaveBeenLastCalledWith(
    expect.objectContaining({
      title: "文件上传失败",
      description: "无法上传任何文件，请重试。",
    }),
  );
  expect(sendMessage).not.toHaveBeenCalled();
  expect(result.current.pendingSend).toBeNull();
});
