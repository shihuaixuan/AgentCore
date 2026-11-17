"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Icon } from "@/components/atoms/Icon/Icon";
import { skillDetailHref } from "@/services/skill-learning/helpers";
import { BookBookmarkIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { CARD, HALF } from "./ResultCards";
import { str } from "./resultHelpers";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  output: Record<string, unknown>;
}

export function SkillLoadedCard({ output }: Props) {
  const { t } = useTranslation();
  const name = str(output, "name");
  const version = output.version;
  if (!name || typeof version !== "number") return null;
  const origin = str(output, "origin_label") ?? t("Saved", "已保存");
  const href = skillDetailHref({
    expertId: str(output, "expert_id"),
    skillName: name,
    versionId: str(output, "version_id"),
  });
  return (
    <div
      className={`${CARD} ${HALF} flex items-center gap-2.5 p-2.5`}
      data-testid="skill-loaded-card"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-hover">
        <Icon icon={BookBookmarkIcon} size={15} tone="secondary" />
      </div>
      <div className="min-w-0 flex-1">
        <Text
          variant="body-sm-medium-inherit"
          tone="emphasis"
          className="truncate"
        >
          {t(
            `Skill loaded: ${name} v${version} · ${origin}`,
            `已加载技能：${name} v${version} · ${origin}`,
          )}
        </Text>
        <Text variant="small-tight" tone="muted" className="truncate">
          {t(
            "Loaded for this task; loading is not a success record.",
            "已为此任务加载；加载本身不代表执行成功。",
          )}
        </Text>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-full bg-surface-hover px-2 py-0.5 text-caption-sm leading-inherit text-foreground-secondary hover:bg-surface-active"
      >
        {t("View change", "查看变更")}
      </Link>
    </div>
  );
}
