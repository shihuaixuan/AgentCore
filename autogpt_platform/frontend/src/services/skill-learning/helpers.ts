import type { SkillVersionSummary } from "@/app/api/__generated__/models/skillVersionSummary";
import type { Locale } from "@/lib/i18n/locale";

export const CHAT_SOURCE_KIND = "chat_session";

const LEARNING_LABELS: Readonly<Record<string, string>> = {
  "Saved overnight": "夜间保存",
  "Saved during work": "工作期间保存",
  "Requested by you": "由你请求",
  "Requested by user": "由用户请求",
  "Requested by owner": "由所有者请求",
  "Edited by you": "由你编辑",
  "Edited by user": "由用户编辑",
  "Edited by owner": "由所有者编辑",
  "Restored by you": "由你恢复",
  "Restored by owner": "由所有者恢复",
  "Deleted by owner": "由所有者删除",
  "Deleted by you": "由你删除",
  Imported: "已导入",
  "Ready to use": "可使用",
  Saving: "正在保存",
  Candidate: "候选项",
  "Needs your decision": "需要你决策",
  "Blocked by content check": "未通过内容检查",
  Paused: "已暂停",
  "Paused (not in use)": "已暂停（未使用）",
  Archived: "已归档",
  "Archived (source unavailable)": "已归档（来源不可用）",
  "Archived (stale)": "已归档（已过期）",
  Deleted: "已删除",
  Applied: "已应用",
  Skipped: "已跳过",
  "Nothing new to learn": "没有需要学习的新内容",
  Deferred: "已推迟",
  Conflict: "存在冲突",
  "Review failed": "审核失败",
  "Budget exhausted": "预算已用尽",
  "Source no longer eligible": "来源已不符合条件",
  "Evidence not accessible": "无法访问依据",
  "Not reapplied (removed by you)": "未重新应用（已由你移除）",
  "Save failed": "保存失败",
  "Outcome recorded": "已记录结果",
  "Not yet reused": "尚未复用",
  "Stopped mid-use": "使用中途停止",
};

export function getLearningLabel(label: string, locale: Locale = "en") {
  return locale === "zh-CN" ? (LEARNING_LABELS[label] ?? label) : label;
}

/**
 * Where a skill's learning detail opens: the Expert's Skills tab, or the
 * Memory page for the personal (AutoPilot) scope. Both open the exact
 * version when one is named.
 */
export function skillDetailHref(args: {
  expertId: string | null | undefined;
  skillName: string;
  versionId?: string | null;
}) {
  const params = new URLSearchParams();
  if (args.expertId) params.set("tab", "skills");
  params.set("skill", args.skillName);
  if (args.versionId) params.set("version", args.versionId);
  if (!args.expertId) return `/settings/memory?${params.toString()}`;
  return `/team/${args.expertId}?${params.toString()}`;
}

/** Restorable: not current, has content, and not invalidated or blocked. */
export function canRestore(
  version: SkillVersionSummary,
  currentVersionId: string | null,
) {
  return (
    version.id !== currentVersionId &&
    Boolean(version.body) &&
    version.state !== "invalidated" &&
    version.state !== "blocked_content"
  );
}

export function versionLabel(
  version: SkillVersionSummary,
  locale: Locale = "en",
) {
  return `v${version.version} · ${getLearningLabel(version.origin_label, locale)}`;
}

export function reuseLabel(
  version: SkillVersionSummary,
  locale: Locale = "en",
) {
  const usage = version.use;
  if (locale === "zh-CN") {
    if (usage?.checks_passed)
      return `在 ${usage.checks_passed} 次后续使用中通过检查`;
    if (usage?.checks_failed)
      return `在 ${usage.checks_failed} 次后续使用中未通过检查`;
    if (usage?.reported_working)
      return `你报告可正常使用（${usage.reported_working} 次报告）`;
    if (usage?.reported_failed)
      return `你报告使用失败（${usage.reported_failed} 次报告）`;
    if (usage?.stopped_mid_use) return "使用中途停止";
    if (usage?.loads) return `已加载 ${usage.loads} 次 · 结果未知`;
    return getLearningLabel(usage?.reuse_label ?? "Not yet reused", locale);
  }
  return usage?.reuse_label ?? "Not yet reused";
}

export interface StepChange {
  step: string;
  before: string | null;
  after: string | null;
}

/**
 * Before/after grouped by procedure step (numbered or bulleted lines). Steps
 * absent on one side render as added/removed; prose outside lists is
 * compared as a single "Other text" entry.
 */
export function stepChanges(
  before: string,
  after: string,
  locale: Locale = "en",
): StepChange[] {
  const previous = stepMap(before, locale);
  const next = stepMap(after, locale);
  const keys = Array.from(new Set([...previous.keys(), ...next.keys()]));
  return keys
    .map((key) => ({
      step: key,
      before: previous.get(key) ?? null,
      after: next.get(key) ?? null,
    }))
    .filter((change) => change.before !== change.after);
}

function stepMap(body: string, locale: Locale) {
  const steps = new Map<string, string>();
  const prose: string[] = [];
  const counts = new Map<string, number>();
  let section = "";
  for (const raw of stripFrontmatter(body).split("\n")) {
    const line = raw.trim();
    const heading = line.match(/^#{1,6}\s+(\S.*)$/);
    const match = line.match(/^(?:\d+[.)]|[-*•])\s+(\S.*)$/);
    if (heading) {
      section = heading[1];
      prose.push(line);
    } else if (match) {
      const index = (counts.get(section) ?? 0) + 1;
      counts.set(section, index);
      const prefix =
        !section || section.toLowerCase() === "steps" ? "" : `${section} · `;
      steps.set(
        `${prefix}${locale === "zh-CN" ? "步骤" : "Step"} ${index}`,
        match[1],
      );
    } else if (line) {
      prose.push(line);
    }
  }
  if (prose.length)
    steps.set(locale === "zh-CN" ? "其他内容" : "Other text", prose.join("\n"));
  return steps;
}

export function stripFrontmatter(content: string) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?/);
  return match ? content.slice(match[0].length) : content;
}

export function lineDiff(before: string, after: string) {
  const previous = stripFrontmatter(before).split("\n");
  const next = stripFrontmatter(after).split("\n");
  let start = 0;
  while (
    start < previous.length &&
    start < next.length &&
    previous[start] === next[start]
  ) {
    start += 1;
  }
  let previousEnd = previous.length;
  let nextEnd = next.length;
  while (
    previousEnd > start &&
    nextEnd > start &&
    previous[previousEnd - 1] === next[nextEnd - 1]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }
  return [
    ...previous.slice(start, previousEnd).map((line) => `- ${line}`),
    ...next.slice(start, nextEnd).map((line) => `+ ${line}`),
  ].join("\n");
}
