import type { ToolUIPart } from "ai";
import type { ToolCategory } from "./helpers";

const TOOL_NAMES: Record<string, string> = {
  run_sub_session: "子任务",
  get_sub_session_result: "子任务结果",
  delegate_to_expert: "团队成员委派",
  handoff_to_expert: "团队成员交接",
  hire_expert: "聘用专家预览",
  raise_expert: "专家升级预览",
  update_expert: "专家更新",
  confirm_expert_change: "专家变更确认",
  run_agent: "工作流",
  view_agent_output: "工作流输出",
  run_block: "操作",
  run_mcp_tool: "MCP 工具",
  find_capability: "能力搜索",
  describe_capability: "能力详情",
  run_capability: "操作",
  resume_capability: "恢复的操作",
  get_agent_building_guide: "工作流构建指南",
};

export function getChineseAnimationText(
  part: ToolUIPart,
  category: ToolCategory,
  toolName: string,
  summary: string | null,
  shortSummary: string | null,
): string {
  const label = TOOL_NAMES[toolName] ?? toolName;
  const input = part.input as Record<string, unknown> | undefined;
  const deep = input?.deep === true;
  const isSearch = toolName === "WebSearch" || toolName === "web_search";
  const output =
    part.output && typeof part.output === "object"
      ? (part.output as Record<string, unknown>)
      : null;
  if (part.state === "output-error") {
    const failures: Partial<Record<ToolCategory, string>> = {
      bash: "命令失败",
      web: isSearch ? (deep ? "研究失败" : "搜索失败") : "获取失败",
      browser: "浏览器操作失败",
      "file-read": "读取文件失败",
      "file-write": "写入文件失败",
      "file-delete": "删除文件失败",
      "file-list": "列出文件失败",
      search: "搜索文件失败",
      edit: "编辑文件失败",
      todo: "更新任务列表失败",
      agent: "子任务失败",
    };
    return failures[category] ?? `${label}失败`;
  }
  if (part.state === "output-available") {
    switch (category) {
      case "bash":
        return shortSummary ? `已运行：${shortSummary}` : "命令已完成";
      case "web":
        if (isSearch)
          return shortSummary
            ? `已${deep ? "研究" : "搜索"} "${shortSummary}"`
            : `网页${deep ? "研究" : "搜索"}已完成`;
        return shortSummary ? `已获取 ${shortSummary}` : "已获取网页内容";
      case "browser":
        if (toolName === "browser_screenshot") return "已截取屏幕";
        return shortSummary ? `已浏览 ${shortSummary}` : "浏览器操作已完成";
      case "file-read":
        return summary ? `已读取 ${summary}` : "文件读取已完成";
      case "file-write":
        return summary ? `已写入 ${summary}` : "文件已写入";
      case "file-delete":
        return summary ? `已删除 ${summary}` : "文件已删除";
      case "file-list":
        return "已列出文件";
      case "search":
        return shortSummary ? `已搜索 "${shortSummary}"` : "搜索已完成";
      case "edit":
        return summary ? `已编辑 ${summary}` : "已编辑文件";
      case "todo":
        return "已更新任务列表";
      case "compaction":
        return "已总结较早的消息";
      case "agent":
        if (toolName === "TaskOutput")
          return output?.retrieval_status === "timeout"
            ? "子任务仍在运行…"
            : "已收到子任务结果";
        if (output?.isAsync || output?.status === "async_launched")
          return shortSummary
            ? `子任务已在后台启动：${shortSummary}`
            : "子任务已在后台启动";
        return shortSummary ? `子任务已完成：${shortSummary}` : "子任务已完成";
      default:
        return `${label}已完成`;
    }
  }
  switch (category) {
    case "bash":
      return shortSummary ? `正在运行：${shortSummary}` : "正在运行命令…";
    case "web":
      if (isSearch)
        return shortSummary
          ? `正在${deep ? "研究" : "搜索"} "${shortSummary}"`
          : `正在${deep ? "研究" : "搜索"}网页…`;
      return shortSummary ? `正在获取 ${shortSummary}` : "正在获取网页内容…";
    case "browser":
      if (toolName === "browser_screenshot") return "正在截取屏幕…";
      return shortSummary ? `正在浏览 ${shortSummary}` : "正在与浏览器交互…";
    case "file-read":
      return summary ? `正在读取 ${summary}` : "正在读取文件…";
    case "file-write":
      return summary ? `正在写入 ${summary}` : "正在写入文件…";
    case "file-delete":
      return summary ? `正在删除 ${summary}` : "正在删除文件…";
    case "file-list":
      return shortSummary ? `正在列出 ${shortSummary}` : "正在列出文件…";
    case "search":
      return shortSummary ? `正在搜索 "${shortSummary}"` : "正在搜索…";
    case "edit":
      return summary ? `正在编辑 ${summary}` : "正在编辑文件…";
    case "todo":
      return shortSummary ?? "正在更新任务列表…";
    case "compaction":
      return "正在总结较早的消息…";
    case "agent":
      if (toolName === "TaskOutput")
        return shortSummary
          ? `正在检查子任务 ${shortSummary}…`
          : "正在检查子任务结果…";
      return shortSummary
        ? `正在运行子任务：${shortSummary}`
        : "正在启动子任务…";
    default:
      return `正在运行 ${label}…`;
  }
}
