import type { APIKeyPermission } from "@/app/api/__generated__/models/aPIKeyPermission";
import type { Locale } from "@/lib/i18n/locale";

export type ScopeAPIVersion = "v2" | "both" | "v1";

export const SCOPE_DESCRIPTIONS: Record<APIKeyPermission, string> = {
  IDENTITY: "View your user ID, e-mail, and timezone",
  EXECUTE_GRAPH: "Run your workflows",
  READ_GRAPH: "View your workflows and their configurations",
  WRITE_GRAPH: "Create and edit your workflows, and choose which version runs",
  WRITE_LIBRARY:
    "Add, organize, fork and remove workflows in your library, including their schedules and triggers",
  EXECUTE_BLOCK: "Execute individual blocks",
  READ_BLOCK: "View available blocks",
  READ_STORE: "Access the Marketplace",
  WRITE_STORE: "Create, update, and delete marketplace submissions",
  READ_LIBRARY: "View your library workflows and folders",
  RUN_AGENT: "Run workflows from your library",
  READ_RUN: "View run details and history",
  WRITE_RUN: "Stop and delete runs",
  SHARE_RUN: "Share and unshare workflow runs",
  READ_RUN_REVIEW: "View pending human-in-the-loop reviews",
  WRITE_RUN_REVIEW: "Submit human-in-the-loop review responses",
  READ_SCHEDULE: "View your schedules",
  WRITE_SCHEDULE: "Create and delete schedules",
  READ_CREDITS:
    "View your credit balance, transactions, invoices and subscription",
  READ_FILES: "List and download workspace files",
  WRITE_FILES: "Upload and delete workspace files",
  USE_TOOLS:
    "Search and fetch web pages for you; web searches count against your usage allowance",
  MANAGE_INTEGRATIONS: "Set up new integrations",
  READ_INTEGRATIONS: "View your connected integrations",
  DELETE_INTEGRATIONS: "Remove connected integrations",
};

const SCOPE_DESCRIPTIONS_ZH: Record<APIKeyPermission, string> = {
  IDENTITY: "查看你的用户 ID、电子邮箱和时区",
  EXECUTE_GRAPH: "运行你的工作流",
  READ_GRAPH: "查看你的工作流及其配置",
  WRITE_GRAPH: "创建和编辑工作流，并选择运行版本",
  WRITE_LIBRARY: "添加、整理、复制和移除工作流库中的工作流及其定时任务和触发器",
  EXECUTE_BLOCK: "执行独立功能块",
  READ_BLOCK: "查看可用功能块",
  READ_STORE: "访问市场",
  WRITE_STORE: "创建、更新和删除市场提交内容",
  READ_LIBRARY: "查看工作流库中的工作流和文件夹",
  RUN_AGENT: "运行工作流库中的工作流",
  READ_RUN: "查看运行详情和历史记录",
  WRITE_RUN: "停止和删除运行记录",
  SHARE_RUN: "分享工作流运行记录或取消分享",
  READ_RUN_REVIEW: "查看待人工审核的操作",
  WRITE_RUN_REVIEW: "提交人工审核答复",
  READ_SCHEDULE: "查看你的定时任务",
  WRITE_SCHEDULE: "创建和删除定时任务",
  READ_CREDITS: "查看积分余额、交易、发票和订阅",
  READ_FILES: "列出和下载工作区文件",
  WRITE_FILES: "上传和删除工作区文件",
  USE_TOOLS: "为你搜索和获取网页；网页搜索将消耗你的使用额度",
  MANAGE_INTEGRATIONS: "配置新的集成服务",
  READ_INTEGRATIONS: "查看已连接的集成服务",
  DELETE_INTEGRATIONS: "移除已连接的集成服务",
};

export function getScopeDescription(
  permission: APIKeyPermission,
  locale: Locale = "en",
) {
  return locale === "zh-CN"
    ? SCOPE_DESCRIPTIONS_ZH[permission]
    : SCOPE_DESCRIPTIONS[permission];
}

// Which version of the public API checks each scope, read from its routes.
export const SCOPE_API_VERSION: Record<APIKeyPermission, ScopeAPIVersion> = {
  IDENTITY: "both",
  EXECUTE_GRAPH: "v1",
  READ_GRAPH: "both",
  WRITE_GRAPH: "both",
  EXECUTE_BLOCK: "v1",
  READ_BLOCK: "both",
  WRITE_LIBRARY: "both",
  USE_TOOLS: "both",
  MANAGE_INTEGRATIONS: "both",
  READ_INTEGRATIONS: "both",
  DELETE_INTEGRATIONS: "both",
  READ_SCHEDULE: "v2",
  WRITE_SCHEDULE: "v2",
  READ_STORE: "v2",
  WRITE_STORE: "v2",
  READ_LIBRARY: "v2",
  RUN_AGENT: "v2",
  READ_RUN: "v2",
  WRITE_RUN: "v2",
  SHARE_RUN: "v2",
  READ_RUN_REVIEW: "v2",
  WRITE_RUN_REVIEW: "v2",
  READ_CREDITS: "v2",
  READ_FILES: "v2",
  WRITE_FILES: "v2",
};

export const SCOPE_GROUPS: { version: ScopeAPIVersion; label: string }[] = [
  { version: "v2", label: "API v2" },
  { version: "both", label: "API v1 and v2" },
  { version: "v1", label: "API v1 only (stops working 2027-02-01)" },
];
