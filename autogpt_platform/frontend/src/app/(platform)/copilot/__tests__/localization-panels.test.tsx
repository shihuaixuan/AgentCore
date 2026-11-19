import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { expect, test, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ArtifactErrorBoundary } from "../components/ArtifactPanel/components/ArtifactErrorBoundary";
import { WorkspaceFilesContent } from "../components/WorkspaceFileCards/components/WorkspaceFilesContent";
import { FeedbackModal } from "../components/ChatMessagesContainer/components/FeedbackModal";
import { CredentialRejectionNotice } from "../components/CredentialRejectionNotice/CredentialRejectionNotice";
import { ExpertKickoffLoader } from "../components/EmptySession/components/ExpertKickoffLoader/ExpertKickoffLoader";
import { StatusIcon } from "../components/TaskProgressBar/components/StatusIcon/StatusIcon";
import { SuggestedTaskList } from "../components/SuggestedTasks/SuggestedTaskList";

test("localizes artifact recovery but preserves diagnostic and clipboard data", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  function BrokenArtifact(): never {
    throw new Error("Raw rendering exception");
  }
  try {
    render(
      <LanguageProvider initialLocale="zh-CN">
        <ArtifactErrorBoundary
          artifactID="original-id"
          artifactTitle="English Artifact"
          artifactType="markdown"
        >
          <BrokenArtifact />
        </ArtifactErrorBoundary>
      </LanguageProvider>,
    );
    expect(screen.getByText("无法渲染此产物")).toBeDefined();
    expect(screen.getByText("English Artifact")).toBeDefined();
    expect(screen.getByText("Raw rendering exception")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "复制错误详情" }));
    expect(writeText.mock.calls[0][0]).toContain(
      "Artifact: English Artifact\nID: original-id\nType: markdown\nError: Raw rendering exception",
    );
  } finally {
    errorSpy.mockRestore();
  }
});

test("localizes workspace file failure and download controls", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <WorkspaceFilesContent
        files={[]}
        isLoading={false}
        isError
        isZipping={false}
        onOpen={vi.fn()}
        onDownload={vi.fn()}
        onRequestDelete={vi.fn()}
        onDownloadAll={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByText("文件")).toBeDefined();
  expect(screen.getByText("加载文件失败。")).toBeDefined();
});

test("localizes feedback controls and submits raw user feedback", () => {
  const onSubmit = vi.fn();
  render(
    <LanguageProvider initialLocale="zh-CN">
      <FeedbackModal isOpen onSubmit={onSubmit} onCancel={vi.fn()} />
    </LanguageProvider>,
  );
  expect(
    screen.getByRole("dialog", { name: "哪些地方可以做得更好？" }),
  ).toBeDefined();
  fireEvent.change(
    screen.getByPlaceholderText(
      "请告诉我们哪里出了问题，或有哪些可以改进的地方…",
    ),
    { target: { value: "Keep my feedback in English" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "提交反馈" }));
  expect(onSubmit).toHaveBeenCalledWith("Keep my feedback in English");
});

test("localizes credential rejection wrapper but not server details", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <CredentialRejectionNotice
        rejection={{
          provider: "original-provider",
          credential_title: "Original credential",
          status_code: 401,
          detail: "Raw API rejection",
        }}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("alert").textContent).toContain(
    '凭据 "Original credential" 被拒绝',
  );
  expect(screen.getByText("Raw API rejection")).toBeDefined();
  expect(screen.getByRole("alert").textContent).toContain("HTTP 401");
});

test("localizes expert loading and progress labels", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <ExpertKickoffLoader expertName="Original Expert" />
      <StatusIcon status="completed" />
      <StatusIcon status="pending" />
    </LanguageProvider>,
  );
  expect(screen.getByText("正在打开 Original Expert 的工作区")).toBeDefined();
  expect(screen.getByLabelText("已完成")).toBeDefined();
  expect(screen.getByLabelText("待处理")).toBeDefined();
});

test("localizes suggested task list counts without changing task titles", () => {
  const tasks = [0, 1, 2, 3].map((index) => ({
    id: `raw-${index}`,
    title: `Raw task ${index}`,
    prompt: `Original prompt ${index}`,
  }));
  render(
    <LanguageProvider initialLocale="zh-CN">
      <SuggestedTaskList
        tasks={tasks}
        experts={[]}
        expertsById={new Map()}
        sendingId="raw-0"
        moreChoice={null}
        onMoreChoice={vi.fn()}
        fallbackFocusID="raw-focus"
        onSend={vi.fn()}
        onRemove={vi.fn()}
      />
    </LanguageProvider>,
  );
  expect(screen.getByRole("list", { name: "你的首批任务" })).toBeDefined();
  expect(screen.getByRole("button", { name: "还有 1 个任务" })).toBeDefined();
  expect(screen.getByRole("status").textContent).toBe("正在启动：Raw task 0");
});
