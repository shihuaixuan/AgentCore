"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { LockIcon, SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { ExpertSection } from "./ExpertSection";

interface Props {
  rules: string[];
}

export function ExpertProtectedRules({ rules }: Props) {
  const { t } = useTranslation();
  if (rules.length === 0) return null;

  function getRuleLabel(rule: string) {
    if (rule === "The expert discloses that it is AI when acting externally.") {
      return t(rule, "对外执行操作时，专家会表明自己是 AI。");
    }
    if (rule === "The expert asks for approval before acting externally.") {
      return t(rule, "对外执行操作前，专家会先征求你的同意。");
    }
    return rule;
  }

  return (
    <ExpertSection
      title={t("Rules this expert cannot break", "这位专家必须遵守的规则")}
      description={t(
        "Part of every expert's soul, and not editable by anyone.",
        "这些是每位专家的核心设定，任何人都无法编辑。",
      )}
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            key={rule}
            className="flex gap-3.5 rounded-2xl bg-surface p-4 smooth-shadow-ring-sm"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-success-surface to-success/15 text-success ring-1 ring-success/20 ring-inset"
            >
              <Icon icon={SecurityCheckIcon} size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-body-md leading-6 text-foreground-emphasis">
                {getRuleLabel(rule)}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-caption text-foreground-tertiary">
                <Icon icon={LockIcon} size={12} aria-hidden="true" />
                {t("Locked", "已锁定")}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </ExpertSection>
  );
}
