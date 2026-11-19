import type { Locale } from "@/lib/i18n/locale";
import type { ChainCategory } from "./toolCatalog.shared";

const CATEGORY_SUMMARY: Record<ChainCategory, [string, string]> = {
  reasoning: ["thought it through", "已完成思考"],
  bash: ["ran commands", "已执行命令"],
  web: ["searched the web", "已搜索网页"],
  browser: ["browsed the web", "已浏览网页"],
  "file-read": ["read files", "已读取文件"],
  "file-write": ["wrote files", "已写入文件"],
  "file-delete": ["deleted files", "已删除文件"],
  "file-list": ["listed files", "已列出文件"],
  search: ["searched files", "已搜索文件"],
  edit: ["edited files", "已编辑文件"],
  todo: ["updated tasks", "已更新任务"],
  compaction: ["summarized context", "已汇总上下文"],
  agent: ["delegated work", "已委派任务"],
  "agent-build": ["built workflows", "已构建工作流"],
  plan: ["planned the approach", "已制定方案"],
  block: ["ran blocks", "已运行功能块"],
  memory: ["managed memory", "已管理记忆"],
  folder: ["organized folders", "已整理文件夹"],
  schedule: ["managed schedules", "已管理定时任务"],
  trigger: ["managed triggers", "已管理触发器"],
  preset: ["managed presets", "已管理预设"],
  chat: ["posted updates", "已发布动态"],
  mcp: ["used MCP tools", "已使用 MCP 工具"],
  docs: ["read the docs", "已阅读文档"],
  skill: ["used skills", "已使用技能"],
  integration: ["connected integrations", "已连接集成服务"],
  feature: ["handled feature requests", "已处理功能请求"],
  question: ["asked you questions", "已向你提问"],
  team: ["changed the team", "已调整团队"],
  info: ["checked your account", "已检查账户"],
  narration: ["", ""],
  other: ["used tools", "已使用工具"],
};

export function getCategorySummary(category: ChainCategory, locale: Locale) {
  return CATEGORY_SUMMARY[category][locale === "zh-CN" ? 1 : 0];
}
