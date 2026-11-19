import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import {
  PromptInputSubmit,
  PromptInputTextarea,
} from "../PromptInput/PromptInput";
import {
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPrevious,
  MessageBranchPage,
} from "../Message/Message";

test("localizes prompt placeholders, loading and submit actions without changing drafts", () => {
  const onStop = vi.fn();
  const { rerender } = render(
    <LanguageProvider>
      <PromptInputTextarea defaultValue="Loading is a user draft" />
      <PromptInputSubmit status="submitted" onStop={onStop} />
    </LanguageProvider>,
  );
  expect(screen.getByPlaceholderText("输入消息…")).toBeDefined();
  expect(screen.getByRole("status", { name: "加载中" })).toBeDefined();
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
    "Loading is a user draft",
  );
  fireEvent.click(screen.getByRole("button", { name: "停止" }));
  expect(onStop).toHaveBeenCalledOnce();
  rerender(
    <LanguageProvider>
      <PromptInputSubmit status="ready" />
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "发送" })).toBeDefined();
});

test("retains English defaults and caller-supplied prompt placeholders", () => {
  render(
    <>
      <PromptInputTextarea placeholder="Raw /path/null" />
      <PromptInputSubmit />
    </>,
  );
  expect(screen.getByPlaceholderText("Raw /path/null")).toBeDefined();
  expect(screen.getByRole("button", { name: "Submit" })).toBeDefined();
});

test("localizes message branch controls and page count while preserving message text", () => {
  render(
    <LanguageProvider>
      <MessageBranch>
        <MessageBranchContent>
          <div key="one">Loading branch</div>
          <div key="two">Copy All branch</div>
        </MessageBranchContent>
        <MessageBranchPrevious />
        <MessageBranchPage />
        <MessageBranchNext />
      </MessageBranch>
    </LanguageProvider>,
  );
  expect(screen.getByRole("button", { name: "上一个分支" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "下一个分支" }));
  expect(screen.getByText("第 2 个，共 2 个")).toBeDefined();
  expect(screen.getByText("Copy All branch")).toBeDefined();
});
