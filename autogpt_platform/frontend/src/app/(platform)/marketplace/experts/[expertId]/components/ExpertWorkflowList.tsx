"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Expert } from "@/app/api/__generated__/models/expert";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Calendar03Icon, FlashIcon } from "@hugeicons/core-free-icons";
import { getCadenceLabel } from "./ExpertWorkflowCard/helpers";
import { ExpertSection } from "./ExpertSection";

interface Props {
  name: string;
  workflows: Expert["workflows"];
}

/** A quiet list at the foot of the page: the name, one line on what it does
 *  and its cadence. The story above sells the expert; this is the detail. */
export function ExpertWorkflowList({ name, workflows }: Props) {
  const { t, locale } = useTranslation();
  if (workflows.length === 0) return null;

  return (
    <ExpertSection
      title={t("Workflows", "工作流")}
      count={workflows.length}
      description={t(
        `Installed and ready to run the moment ${name} joins your team.`,
        `${name} 加入团队后，这些工作流即可立即运行。`,
      )}
      quiet
    >
      <ul className="divide-y divide-border-base/70 rounded-2xl bg-surface px-4 smooth-shadow-ring-sm">
        {workflows.map((workflow) => (
          <li
            key={workflow.id}
            className="flex items-start gap-3 py-3 text-foreground-subtle"
          >
            <Icon
              icon={FlashIcon}
              size={16}
              aria-hidden
              className="mt-0.5 shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-foreground-emphasis">
                  {workflow.name ?? t("Unnamed workflow", "未命名工作流")}
                </p>
                {workflow.description ? (
                  <p className="truncate text-body-sm leading-inherit text-foreground-tertiary">
                    {workflow.description}
                  </p>
                ) : null}
              </div>
              {workflow.schedule_cron ? (
                <span className="flex shrink-0 items-center gap-1 text-caption text-foreground-tertiary sm:mt-0.5">
                  <Icon icon={Calendar03Icon} size={13} aria-hidden="true" />
                  {getCadenceLabel(workflow.schedule_cron, locale)}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </ExpertSection>
  );
}
