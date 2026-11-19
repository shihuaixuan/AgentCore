import type { ToolUIPart } from "ai";
import { expect, test } from "vitest";
import { fireEvent, render, screen } from "@/tests/integrations/test-utils";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { GenericTool } from "../GenericTool";
import { getAnimationText, getToolCategory } from "../helpers";

function part(
  tool: string,
  state: string,
  input: unknown = {},
  output: unknown = {},
): ToolUIPart {
  return {
    type: `tool-${tool}`,
    toolCallId: "raw-call-id",
    state,
    input,
    output,
  } as ToolUIPart;
}

test.each([
  [
    "bash_exec",
    "input-available",
    { command: "npm test -- raw" },
    {},
    "正在运行：npm test -- raw",
  ],
  [
    "web_search",
    "input-streaming",
    { query: "English query" },
    {},
    '正在搜索 "English query"',
  ],
  ["web_search", "output-available", { deep: true }, {}, "网页研究已完成"],
  ["browser_screenshot", "input-available", {}, {}, "正在截取屏幕…"],
  [
    "Read",
    "input-available",
    { file_path: "/workspace/Keep_RAW.md" },
    {},
    "正在读取 /workspace/Keep_RAW.md",
  ],
  [
    "write_workspace_file",
    "output-available",
    { file_path: "/workspace/Original.txt" },
    {},
    "已写入 /workspace/Original.txt",
  ],
  ["context_compaction", "input-available", {}, {}, "正在总结较早的消息…"],
  [
    "TaskOutput",
    "output-available",
    {},
    { retrieval_status: "timeout" },
    "子任务仍在运行…",
  ],
  [
    "Task",
    "output-available",
    { description: "Raw model description" },
    { isAsync: true },
    "子任务已在后台启动：Raw model description",
  ],
  ["run_agent", "output-error", {}, {}, "工作流失败"],
  ["new_custom_tool", "input-available", {}, {}, "正在运行 new_custom_tool…"],
])(
  "localizes %s %s without rewriting raw values",
  (tool, state, input, output, expected) => {
    const value = part(tool, state, input, output);
    const original = JSON.stringify(value);
    expect(getAnimationText(value, getToolCategory(tool), "zh-CN")).toBe(
      expected,
    );
    expect(JSON.stringify(value)).toBe(original);
  },
);

test("keeps animation labels English when locale is omitted", () => {
  expect(
    getAnimationText(
      part("bash_exec", "input-available", { command: "echo raw" }),
      "bash",
    ),
  ).toBe("Running: echo raw");
});

test("localizes command result UI and preserves command, stdout and stderr", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <GenericTool
        part={part(
          "bash_exec",
          "output-available",
          { command: "echo /workspace/RAW" },
          {
            exit_code: 1,
            stdout: "Original stdout",
            stderr: "Original failure",
          },
        )}
      />
    </LanguageProvider>,
  );
  const trigger = screen.getByRole("button", { expanded: false });
  expect(trigger.textContent).toContain("命令失败（退出码 1）");
  expect(trigger.textContent).toContain("状态码 1 · Original failure");
  fireEvent.click(trigger);
  expect(screen.getByText("命令")).toBeDefined();
  expect(screen.getByText("标准输出")).toBeDefined();
  expect(screen.getByText("标准错误")).toBeDefined();
  expect(screen.getByText("echo /workspace/RAW")).toBeDefined();
  expect(screen.getByText("Original stdout")).toBeDefined();
  expect(screen.getByText("Original failure")).toBeDefined();
});

test("localizes result counts while preserving source titles and snippets", () => {
  render(
    <LanguageProvider initialLocale="zh-CN">
      <GenericTool
        part={part(
          "web_search",
          "output-available",
          { query: "Raw query" },
          {
            results: [
              {
                title: "English source",
                url: "https://example.com/raw",
                snippet: "Original snippet",
              },
            ],
          },
        )}
      />
    </LanguageProvider>,
  );
  const trigger = screen.getByRole("button", { expanded: false });
  expect(trigger.textContent).toContain("1 条搜索结果");
  fireEvent.click(trigger);
  expect(
    screen.getByRole("link", { name: "English source" }).getAttribute("href"),
  ).toBe("https://example.com/raw");
  expect(screen.getByText("Original snippet")).toBeDefined();
});
