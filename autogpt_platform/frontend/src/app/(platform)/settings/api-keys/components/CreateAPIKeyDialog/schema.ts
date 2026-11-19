import { z } from "zod";

import { APIKeyPermission } from "@/app/api/__generated__/models/aPIKeyPermission";
import { SCOPE_API_VERSION, SCOPE_GROUPS } from "@/lib/api-key-scopes";
import type { Locale } from "@/lib/i18n/locale";

export const createAPIKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  permissions: z
    .array(z.nativeEnum(APIKeyPermission))
    .min(1, "Select at least one permission"),
});

export type CreateAPIKeyFormValues = z.infer<typeof createAPIKeySchema>;

const PERMISSION_LABELS_ZH: Record<APIKeyPermission, string> = {
  IDENTITY: "身份信息",
  EXECUTE_GRAPH: "执行工作流",
  READ_GRAPH: "查看工作流",
  WRITE_GRAPH: "编辑工作流",
  WRITE_LIBRARY: "管理工作流库",
  EXECUTE_BLOCK: "执行功能块",
  READ_BLOCK: "查看功能块",
  READ_STORE: "访问市场",
  WRITE_STORE: "管理市场提交",
  READ_LIBRARY: "查看工作流库",
  RUN_AGENT: "运行工作流",
  READ_RUN: "查看运行记录",
  WRITE_RUN: "管理运行记录",
  SHARE_RUN: "分享运行记录",
  READ_RUN_REVIEW: "查看人工审核",
  WRITE_RUN_REVIEW: "提交人工审核",
  READ_SCHEDULE: "查看定时任务",
  WRITE_SCHEDULE: "管理定时任务",
  READ_CREDITS: "查看积分",
  READ_FILES: "查看文件",
  WRITE_FILES: "管理文件",
  USE_TOOLS: "使用工具",
  MANAGE_INTEGRATIONS: "配置集成服务",
  READ_INTEGRATIONS: "查看集成服务",
  DELETE_INTEGRATIONS: "移除集成服务",
};

export function humanizePermission(
  permission: APIKeyPermission,
  locale: Locale = "en",
): string {
  if (locale === "zh-CN" && PERMISSION_LABELS_ZH[permission])
    return PERMISSION_LABELS_ZH[permission];
  return permission
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const PERMISSION_GROUPS = SCOPE_GROUPS.map((group) => ({
  ...group,
  options: Object.values(APIKeyPermission)
    .filter((permission) => SCOPE_API_VERSION[permission] === group.version)
    .map((permission) => ({
      value: permission,
      label: humanizePermission(permission),
    })),
}));
