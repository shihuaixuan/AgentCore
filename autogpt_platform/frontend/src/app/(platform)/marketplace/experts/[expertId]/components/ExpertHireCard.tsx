"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Expert } from "@/app/api/__generated__/models/expert";
import { Icon } from "@/components/atoms/Icon/Icon";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";

interface Props {
  expert: Expert;
  actions: ReactNode;
}

/** The page's call to action, kept in view: sticky beside the content on
 *  wide screens, straight under the hero on phones. */
export function ExpertHireCard({ expert, actions }: Props) {
  const { t } = useTranslation();
  const workflowCount = expert.workflows.length;

  return (
    <aside className="rounded-2xl bg-surface p-5 smooth-shadow-ring-sm">
      <div className="[&_a]:w-full [&_button]:w-full">{actions}</div>

      <ul className="mt-5 flex flex-col gap-2.5">
        <Perk icon={CheckmarkCircle02Icon}>
          {t("No extra cost", "无额外费用")}
        </Perk>
        <Perk icon={CheckmarkCircle02Icon}>
          {t("Joins your team instantly", "立即加入你的团队")}
        </Perk>
        {workflowCount > 0 ? (
          <Perk icon={CheckmarkCircle02Icon}>
            {t(
              `${workflowCount} ${workflowCount === 1 ? "workflow" : "workflows"} installed and ready to run`,
              `${workflowCount} 个工作流已安装，可立即运行`,
            )}
          </Perk>
        ) : null}
        <Perk icon={CheckmarkCircle02Icon}>
          {t("Asks before acting on your behalf", "代表你执行操作前先征求确认")}
        </Perk>
      </ul>
    </aside>
  );
}

function Perk({
  icon,
  children,
}: {
  icon: typeof CheckmarkCircle02Icon;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 text-body text-foreground-body">
      <Icon
        icon={icon}
        size={16}
        tone="success"
        className="mt-0.5 shrink-0"
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}
