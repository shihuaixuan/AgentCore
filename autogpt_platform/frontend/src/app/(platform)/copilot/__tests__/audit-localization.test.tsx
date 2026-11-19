import { afterEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ClarificationQuestionsCard } from "../components/ClarificationQuestionsCard/ClarificationQuestionsCard";
import { PausedDraftNote } from "../components/ChatContainer/components/PausedDraftNote";
import { WorkspaceFilesTrigger } from "../components/WorkspaceFilesTrigger/WorkspaceFilesTrigger";
import { FileDropZone } from "../components/FileDropZone/FileDropZone";
import { NoAIConnectionNotice } from "../components/ChatInput/components/NoAIConnectionNotice/NoAIConnectionNotice";
import { UserRowActions } from "../components/ChatMessagesContainer/components/MessageRow/components/UserRowActions";
import { ArtifactMiniCard } from "../components/ContextPanel/components/ArtifactsTab/components/ArtifactMiniCard";
import type { SessionFile } from "../components/ContextPanel/components/FilesTab/useSessionFiles";
import { UsageBar } from "../components/UsageLimits/UsageBar";
import { formatResetTime, formatTierLabel } from "../components/usageHelpers";
import { formatUsageDate } from "@/services/usageExperience/helpers";

const originalToLocaleString = Date.prototype.toLocaleString;

function mockEnglishSystemDateFormat() {
  return vi
    .spyOn(Date.prototype, "toLocaleString")
    .mockImplementation(function (this: Date, locales, options) {
      return originalToLocaleString.call(this, locales ?? "en-US", options);
    });
}

vi.mock(
  "../components/ChatInput/components/NoAIConnectionNotice/useNoAIConnectionNotice",
  () => ({ useNoAIConnectionNotice: () => ({ hasNoConnection: true }) }),
);

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("localizes clarification controls and preserves questions, examples and submitted answers", () => {
  const onSubmitAnswers = vi.fn();
  render(
    <LanguageProvider>
      <ClarificationQuestionsCard
        questions={[
          {
            keyword: "raw",
            question: "Original question",
            example: "Original example",
          },
        ]}
        message="Original model explanation"
        onSubmitAnswers={onSubmitAnswers}
        onCancel={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("需要更多信息")).toBeDefined();
  expect(screen.getByText("Original model explanation")).toBeDefined();
  expect(screen.getByText("示例：Original example")).toBeDefined();
  fireEvent.change(screen.getByPlaceholderText("请输入你的回答…"), {
    target: { value: "Raw user answer" },
  });
  fireEvent.click(screen.getByRole("button", { name: "提交回答" }));
  expect(onSubmitAnswers).toHaveBeenCalledWith({ raw: "Raw user answer" });
  expect(screen.getByText("回答已提交")).toBeDefined();
});

test("localizes paused drafts, workspace triggers and file drops without changing file payloads", () => {
  const onFilesDropped = vi.fn();
  render(
    <LanguageProvider>
      <PausedDraftNote />
      <WorkspaceFilesTrigger />
      <FileDropZone onFilesDropped={onFilesDropped}>
        <div>Raw children</div>
      </FileDropZone>
    </LanguageProvider>,
  );
  expect(
    screen.getByText("草稿已保存。发送暂停期间，你仍可继续编辑。"),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "打开工作区文件" })).toBeDefined();
  const file = new File(["Original content"], "Original.txt");
  fireEvent.drop(screen.getByText("Raw children").parentElement!, {
    dataTransfer: { files: [file] },
  });
  expect(screen.getByText("将文件拖放到此处")).toBeDefined();
  expect(onFilesDropped).toHaveBeenCalledWith([file]);
});

test("localizes missing model guidance and preserves setup and settings destinations", () => {
  render(
    <LanguageProvider>
      <NoAIConnectionNotice enabled />
    </LanguageProvider>,
  );
  expect(screen.getByRole("status", { name: "未连接 AI 模型" })).toBeDefined();
  expect(
    screen.getByRole("link", { name: "设置 → AI 连接" }).getAttribute("href"),
  ).toBe("/settings/ai-connections");
  expect(
    screen.getByRole("link", { name: "（设置指南）" }).getAttribute("href"),
  ).toContain("https://");
});

test("formats user message timestamps with an explicit Chinese locale", () => {
  const formatTimestamp = vi.spyOn(Date.prototype, "toLocaleString");
  render(
    <LanguageProvider initialLocale="zh-CN">
      <UserRowActions
        showQueueBadge={false}
        showCopy
        createdAt="2026-11-18T12:34:00Z"
        copyText="Original user message"
      />
    </LanguageProvider>,
  );

  expect(screen.getByRole("button", { name: "复制" })).toBeDefined();
  expect(formatTimestamp).toHaveBeenCalledWith("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
});

test("passes the Chinese locale through artifact cards to file timestamps", () => {
  const formatTimestamp = vi.spyOn(Date.prototype, "toLocaleDateString");
  const file: SessionFile = {
    item: {
      id: "original-file-id",
      name: "Original-report.md",
      path: "/sessions/date-localization/Original-report.md",
      mime_type: "text/markdown",
      size_bytes: 1024,
      origin: "generated",
      created_at: "2026-11-18T12:34:00Z",
    },
    messageID: null,
  };
  render(
    <LanguageProvider initialLocale="zh-CN">
      <ArtifactMiniCard file={file} onOpen={vi.fn()} onDownload={vi.fn()} />
    </LanguageProvider>,
  );

  expect(screen.getByText("Original-report.md")).toBeDefined();
  expect(formatTimestamp).toHaveBeenCalledWith("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
});

test.each([
  { resetsAt: new Date(2026, 10, 18, 13, 30), expected: "1小时30分钟后重置" },
  { resetsAt: new Date(2026, 10, 18, 12), expected: "立即重置" },
])(
  "renders the Chinese usage reset text: $expected",
  ({ resetsAt, expected }) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 18, 12));
    render(
      <LanguageProvider initialLocale="zh-CN">
        <UsageBar label="今日" percentUsed={50} resetsAt={resetsAt} />
      </LanguageProvider>,
    );

    expect(screen.getByText(expected)).toBeDefined();
  },
);

test.each([
  { minutes: 90, expected: "1小时30分钟后" },
  { minutes: 0, expected: "立即" },
])("localizes the reset helper result: $expected", ({ minutes, expected }) => {
  const now = new Date(2026, 10, 18, 12);
  const resetsAt = new Date(now.getTime() + minutes * 60_000);

  expect(formatResetTime(resetsAt, now, "zh-CN")).toBe(expected);
});

test("formats longer reset intervals in Chinese with an English system default", () => {
  const formatTimestamp = mockEnglishSystemDateFormat();
  const now = new Date(2026, 10, 18, 12);

  expect(
    formatResetTime(new Date(2026, 10, 20, 13, 30), now, "zh-CN"),
  ).toContain("周五");
  expect(formatTimestamp).toHaveBeenCalledWith("zh-CN", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
});

test("formats usage dates in Chinese with an English system default", () => {
  const formatTimestamp = mockEnglishSystemDateFormat();

  expect(formatUsageDate(new Date(2026, 10, 18, 13, 30), "zh-CN")).toContain(
    "11月18日",
  );
  expect(formatTimestamp).toHaveBeenCalledWith("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
});

test("labels generic trial tiers as free trials while retaining the English default", () => {
  expect(formatTierLabel("TRIAL", "zh-CN")).toBe("免费试用");
  expect(formatTierLabel("TRIAL", "en")).toBe("Free trial");
  expect(formatTierLabel("TRIAL")).toBe("Free trial");
});
