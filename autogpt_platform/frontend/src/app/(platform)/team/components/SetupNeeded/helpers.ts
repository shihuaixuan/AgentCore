import type { ExpertSetupItem } from "@/app/api/__generated__/models/expertSetupItem";
import { formatProviderName } from "@/components/contextual/IntegrationsPanel/helpers";
import type { Locale } from "@/lib/i18n/locale";

export function isCredentialItem(item: ExpertSetupItem) {
  return item.resolution === "connect" || item.resolution === "allow";
}

export function getSetupRowCopy(
  item: ExpertSetupItem,
  expertTitle: string,
  locale: Locale = "en",
) {
  const workflowName =
    item.workflow_name ?? (locale === "zh-CN" ? "工作流" : "a workflow");
  if (isCredentialItem(item)) {
    const provider = item.providers[0];
    if (locale === "zh-CN") {
      return {
        title: `${expertTitle} 的${provider ? ` ${formatProviderName(provider)}` : "服务"}`,
        detail: `${workflowName} 需要此服务才能按计划运行。`,
      };
    }
    return {
      title: `${provider ? formatProviderName(provider) : "A service"} for ${expertTitle}`,
      detail: `${workflowName} needs it to run on schedule.`,
    };
  }
  if (locale === "zh-CN") {
    return {
      title: `为 ${expertTitle} 设置 ${workflowName} 的计划`,
      detail:
        item.resolution === "inputs"
          ? `需要填写 ${item.missing_inputs?.length ? item.missing_inputs.join("、") : "一些信息"} 才能按计划运行。`
          : "所有连接均已就绪，仍需创建计划。",
    };
  }
  return {
    title: `Schedule ${workflowName} for ${expertTitle}`,
    detail:
      item.resolution === "inputs"
        ? `Needs ${formatInputList(item.missing_inputs ?? [])} before it can run on schedule.`
        : "Every connection is in place; the schedule still has to be created.",
  };
}

function formatInputList(names: string[]) {
  if (names.length === 0) return "a few details from you";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
