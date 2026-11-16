import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { humanizeKey } from "./resultHelpers";

const LABELS: Record<string, [string, string]> = {
  ok: ["Ok", "成功"],
  success: ["Success", "成功"],
  status: ["Status", "状态"],
  name: ["Name", "名称"],
  description: ["Description", "描述"],
  result: ["Result", "结果"],
  results: ["Results", "结果"],
  output: ["Output", "输出"],
  outputs: ["Outputs", "输出"],
  error: ["Error", "错误"],
  errors: ["Errors", "错误"],
  count: ["Count", "数量"],
  total: ["Total", "总计"],
  total_count: ["Total count", "总数量"],
  file_count: ["File count", "文件数量"],
  agent_count: ["Workflow count", "工作流数量"],
  agent_id: ["Workflow ID", "工作流 ID"],
  agent_ids: ["Workflow IDs", "工作流 ID"],
  graph_id: ["Workflow ID", "工作流 ID"],
  graph_version: ["Workflow version", "工作流版本"],
  execution_id: ["Run ID", "运行 ID"],
  session_id: ["Chat ID", "对话 ID"],
  expert_id: ["Expert ID", "专家 ID"],
  skills: ["Skills", "技能"],
  channels: ["Channels", "频道"],
  suggestions: ["Suggestions", "建议"],
  message: ["Message", "消息"],
  url: ["Url", "链接"],
  path: ["Path", "路径"],
  size: ["Size", "大小"],
  size_bytes: ["Size bytes", "大小（字节）"],
  created_at: ["Created at", "创建时间"],
  updated_at: ["Updated at", "更新时间"],
  next_run_time: ["Next run time", "下次运行时间"],
  has_more: ["Has more", "还有更多"],
  valid: ["Valid", "验证通过"],
};

export function useResultLabels() {
  const { t } = useTranslation();
  return function resultLabel(key: string) {
    const label = Object.hasOwn(LABELS, key) ? LABELS[key] : undefined;
    return label ? t(...label) : humanizeKey(key);
  };
}
