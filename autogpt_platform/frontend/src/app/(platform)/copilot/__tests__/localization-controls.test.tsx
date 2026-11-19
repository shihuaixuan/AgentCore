import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AttachmentCapNotice } from "../components/ChatInput/components/AttachmentCapNotice";
import { AtResetFilesNotice } from "../components/ChatInput/components/AtResetFilesNotice";
import { FileChips } from "../components/ChatInput/components/FileChips";
import { RecipientChip } from "../components/ChatInput/components/RecipientChip";
import { ReasoningCollapse } from "../components/ChatMessagesContainer/components/ReasoningCollapse";
import { StoppedTaskCard } from "../components/ChatMessagesContainer/components/StoppedTaskCard";
import { DeleteFileDialog } from "../components/ContextPanel/components/FilesTab/components/DeleteFileDialog";
import { FilesEmptyState } from "../components/WorkspaceFileCards/components/FilesEmptyState";
import { TaskRow } from "../components/SuggestedTasks/components/TaskRow";
import { YourTeamRow } from "../components/SuggestedTasks/components/YourTeamRow";

test("localizes attachment limits and reset restrictions", () => {
  const onDismiss = vi.fn();
  render(
    <LanguageProvider initialLocale="zh-CN">
      <AttachmentCapNotice refusedCount={2} onDismiss={onDismiss} />
      <AtResetFilesNotice />
    </LanguageProvider>,
  );
  expect(screen.getByText(/每条消息最多.*2 个未添加/)).toBeDefined();
  expect(
    screen.getByText("仅文本消息可以等待额度重置。请移除文件后再安排发送。"),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "关闭附件数量限制提示" }));
  expect(onDismiss).toHaveBeenCalledOnce();
});

test("localizes attachment actions without changing file names", () => {
  const onRemove = vi.fn();
  render(
    <LanguageProvider initialLocale="zh-CN">
      <FileChips
        attachments={[
          {
            kind: "local",
            file: new File(["raw English"], "Keep Original.txt", {
              type: "text/plain",
            }),
          },
        ]}
        onRemove={onRemove}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("Keep Original.txt")).toBeDefined();
  fireEvent.click(
    screen.getByRole("button", { name: "移除 Keep Original.txt" }),
  );
  expect(onRemove).toHaveBeenCalledWith(0);
});

test("localizes recipient accessibility labels while preserving identity", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <RecipientChip
        recipient={{ id: "raw-id", name: "English Expert", avatarUrl: null }}
        options={[]}
        onSelect={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(
    screen.getByRole("button", { name: "发送给 English Expert，更换接收者" }),
  ).toBeDefined();
  expect(screen.getByText("English Expert")).toBeDefined();
});

test("localizes reasoning controls but never model text", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <ReasoningCollapse>Thinking about /workspace/raw-path</ReasoningCollapse>
      <StoppedTaskCard />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "推理过程" }));
  expect(screen.getByText("Thinking about /workspace/raw-path")).toBeDefined();
  expect(screen.getByRole("button", { name: "收起" })).toBeDefined();
  expect(screen.getByText("任务已停止")).toBeDefined();
});

test("localizes file removal without translating the file name", () => {
  const onConfirm = vi.fn();
  render(
    <LanguageProvider initialLocale="zh-CN">
      <DeleteFileDialog
        fileName="Delete Me.md"
        isDeleting={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("dialog", { name: "删除文件" })).toBeDefined();
  expect(screen.getByText('"Delete Me.md"')).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "删除" }));
  expect(onConfirm).toHaveBeenCalledOnce();
});

test("localizes the workspace empty state", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <FilesEmptyState />
    </LanguageProvider>,
  );
  expect(screen.getByText("暂无文件")).toBeDefined();
  expect(
    screen.getByText("你添加的附件和 Otto 在此对话中创建的文档会显示在这里。"),
  ).toBeDefined();
});

test("localizes suggested task controls and preserves the complete task payload", () => {
  const task = {
    id: "raw-task-id",
    title: "Review English report",
    prompt: "Run npm test in /workspace",
    why: "Keep model explanation",
    state: "open" as const,
  };
  const onSend = vi.fn();
  render(
    <LanguageProvider initialLocale="zh-CN">
      <ul>
        <TaskRow
          task={task}
          owner={{ kind: "otto" }}
          isStartHere
          showWhy
          isBusy={false}
          isSending={false}
          isRemoveDisabled={false}
          onSend={onSend}
          onRemove={vi.fn()}
        />
      </ul>
      <YourTeamRow experts={[]} />
    </LanguageProvider>,
  );
  expect(screen.getByText("从这里开始")).toBeDefined();
  expect(screen.getByText("Keep model explanation")).toBeDefined();
  expect(screen.getByText("你的团队")).toBeDefined();
  expect(screen.getByText("AI 负责人")).toBeDefined();
  fireEvent.click(
    screen.getByRole("button", { name: "与 Otto 开始：Review English report" }),
  );
  expect(onSend).toHaveBeenCalledWith(task);
  expect(
    screen.getByRole("button", { name: "移除：Review English report" }),
  ).toBeDefined();
});

test("retains English compatibility without a language provider", () => {
  render(
    <>
      <FilesEmptyState />
      <StoppedTaskCard />
      <RecipientChip
        recipient={{ id: "raw-id", name: "English Expert", avatarUrl: null }}
        options={[]}
        onSelect={vi.fn()}
      />
    </>,
  );
  expect(screen.getByText("No files yet")).toBeDefined();
  expect(screen.getByText("Task stopped")).toBeDefined();
  expect(
    screen.getByRole("button", {
      name: "Sending to English Expert — change recipient",
    }),
  ).toBeDefined();
});
