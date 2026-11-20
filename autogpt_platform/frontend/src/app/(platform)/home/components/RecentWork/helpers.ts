import { AUTOPILOT_NAME } from "@/lib/branding";
import type { useTranslation } from "@/lib/i18n/LanguageProvider";
import { File01Icon, PlugIcon, RepeatIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { HomeBriefingOutcome } from "@/app/api/__generated__/models/homeBriefingOutcome";
import type { HomeRecentWorkGroup } from "@/app/api/__generated__/models/homeRecentWorkGroup";
import type { HomeRecentWorkItemCategory } from "@/app/api/__generated__/models/homeRecentWorkItemCategory";
import type { HomeWorkActorKind } from "@/app/api/__generated__/models/homeWorkActorKind";

export function getWorkItemIcon(
  category: HomeRecentWorkItemCategory,
): IconSvgElement {
  if (category === "integration") return PlugIcon;
  if (category === "schedule") return RepeatIcon;
  return File01Icon;
}

// The team did the work on someone's behalf; a workflow ran on its own.
export function splitGroupsBySection(groups: HomeRecentWorkGroup[]) {
  return {
    team: groups.filter((group) => group.actor.kind !== "workflow"),
    workflows: groups.filter((group) => group.actor.kind === "workflow"),
  };
}

export function getRunTriggerLabel(
  trigger: HomeBriefingOutcome["trigger"],
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
): string {
  if (trigger === "schedule") return t("Scheduled run", "计划运行");
  if (trigger === "webhook") return t("Triggered run", "触发运行");
  return t("Manual run", "手动运行");
}

type ActorChip = { label: string; className: string };

// The chip is the fastest way to tell the two halves of the card apart, so
// each kind gets its own colour and a matching glow.
const ACTOR_CHIPS: Record<HomeWorkActorKind, ActorChip> = {
  expert: {
    label: "Expert",
    className:
      // oxlint-disable-next-line design-system/no-arbitrary-values -- the chip's coloured glow has no shadow token
      "border-info/30 bg-info-surface text-info-foreground shadow-[0_0_8px_-1px_rgba(96,165,250,0.7)]",
  },
  workflow: {
    label: "Workflow",
    className:
      // oxlint-disable-next-line design-system/no-arbitrary-values -- the yellow glow has no shadow token
      "border-warning-border bg-warning-surface text-yellow-foreground shadow-[0_0_8px_-1px_rgba(247,205,51,0.9)]",
  },
  autopilot: {
    label: AUTOPILOT_NAME,
    className: "border-border-base bg-surface text-foreground-tertiary",
  },
};

export function getActorChip(kind: HomeWorkActorKind): ActorChip {
  return ACTOR_CHIPS[kind] ?? ACTOR_CHIPS.autopilot;
}

// The feed spans a week, so the weekday is load-bearing: "Mon 10:45" vs
// three files all labelled "10:45".
export function formatWorkTime(
  value: Date | null | undefined,
  timeZone: string,
  locale?: string,
): string {
  if (!value) return locale === "zh-CN" ? "最近" : "Recently";
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatGroupCounts(
  group: HomeRecentWorkGroup,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
): string {
  return [
    t(
      countLabel(group.run_count ?? 0, "run") ?? "",
      (group.run_count ?? 0) ? `${group.run_count} 次运行` : "",
    ),
    t(
      countLabel(group.file_count ?? 0, "file") ?? "",
      (group.file_count ?? 0) ? `${group.file_count} 个文件` : "",
    ),
    t(
      countLabel(group.integration_count ?? 0, "action") ?? "",
      (group.integration_count ?? 0) ? `${group.integration_count} 项操作` : "",
    ),
    t(
      countLabel(group.schedule_count ?? 0, "schedule") ?? "",
      (group.schedule_count ?? 0) ? `${group.schedule_count} 项计划` : "",
    ),
  ]
    .filter(Boolean)
    .join(" · ");
}

function countLabel(count: number, noun: string): string | null {
  if (count === 0) return null;
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
