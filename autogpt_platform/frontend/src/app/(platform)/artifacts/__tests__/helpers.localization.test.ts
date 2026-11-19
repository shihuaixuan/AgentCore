import { expect, test } from "vitest";
import {
  formatDayLabel,
  formatRelativeDate,
  getEmptyState,
  getFileTypeLabel,
} from "../components/ArtifactsList/helpers";

const chinese = (_english: string, translated: string) => translated;

test("translates artifact empty state templates without changing profession titles or IDs", () => {
  const state = getEmptyState(
    {
      hasSearchTerm: false,
      isInFolder: false,
      hasFolders: false,
      folderId: null,
      expert: { id: "expert/id", title: "QA Engineer" },
    },
    chinese,
  );
  expect(state.title).toBe("此专家暂无文件");
  expect(state.description).toBe(
    "QA Engineer 执行任务时创建的文件会显示在这里。",
  );
  expect(state.chatLabel).toBe("与 QA Engineer 聊天");
  expect(state.chatHref).toBe("/copilot?expertId=expert%2Fid");
});

test("translates empty search states and retains the upload destination", () => {
  const state = getEmptyState(
    {
      hasSearchTerm: true,
      isInFolder: true,
      hasFolders: false,
      folderId: "original-folder",
      expert: null,
    },
    chinese,
  );
  expect(state.title).toBe("没有与搜索条件匹配的文件");
  expect(state.uploadFolderId).toBe("original-folder");
});

test("localizes display-only artifact types while preserving technical format names", () => {
  expect(getFileTypeLabel("image/png", "Original.png", chinese)).toBe("图片");
  expect(getFileTypeLabel("application/json", "Original.json", chinese)).toBe(
    "JSON 数据",
  );
  expect(getFileTypeLabel("text/markdown", "Original.md", chinese)).toBe(
    "Markdown",
  );
  expect(getFileTypeLabel("image/png", "Original.png")).toBe("Image");
});

test("localizes relative dates and day labels with English fallback", () => {
  expect(formatRelativeDate(new Date(), "zh-CN")).toBe("刚刚");
  expect(formatDayLabel(new Date(), "zh-CN")).toBe("今天");
  expect(formatDayLabel(new Date(), "en")).toBe("Today");
});
