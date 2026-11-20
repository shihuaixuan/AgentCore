"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { PlanProgress } from "@/app/api/__generated__/models/planProgress";
import type { PlanResponse } from "@/app/api/__generated__/models/planResponse";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { AssistantPortrait } from "../../../../components/AssistantPortrait";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useOnboardingWizardStore } from "../../../../store";
import {
  type ConsentMoment,
  getStepTasks,
  getTaskOwner,
  PLAN_STEP_TASKS,
  roleHeard,
} from "./helpers";
import { PlanConsentLine } from "./PlanConsentLine";
import { PlanProgressCard } from "./PlanProgressCard";
import { PlanTaskCard } from "./PlanTaskCard";

export const PLAN_HEADING_ID = "plan-heading";

interface Props {
  plan: PlanResponse | null;
  /** How far the server has got while `plan` is still on its way. */
  progress?: PlanProgress | null;
  moment: ConsentMoment;
  /** The whole card (no paywall). */
  standalone?: boolean;
  /** The plan's heading is the page's title: standalone, or while the
   * trial's own heading is still loading. */
  isPageTitle?: boolean;
  footer?: ReactNode;
}

// Your assistant's plan: what he heard, the first three tasks and who takes each, and
// when they join. Nothing here is a control; the step's only action is the
// trial (or Continue) beside or below it.
export function PlanPanel({
  plan,
  progress,
  moment,
  standalone = false,
  isPageTitle = standalone,
  footer,
}: Props) {
  const { t } = useTranslation();
  return (
    <div
      data-testid="plan-panel"
      className={cn(
        "flex flex-col gap-3.5 bg-surface-muted px-5 pt-6 pb-5 sm:px-7 [@media(max-height:780px)]:gap-2.5 [@media(max-height:780px)]:py-5",
        !standalone && "border-b border-border-base lg:border-r lg:border-b-0",
      )}
    >
      <div className="flex items-center gap-2">
        <AssistantPortrait size={26} />
        <Text variant="small-medium" as="span" tone="secondary">
          {t("Your assistant's plan", "助手的计划")}
        </Text>
      </div>
      <Text
        variant="h4"
        as={isPageTitle ? "h1" : "h2"}
        id={PLAN_HEADING_ID}
        className="text-balance"
      >
        {t("Here's what your team does first", "团队将优先完成这些工作")}
      </Text>
      {/* Outside the busy skeleton, so the plan landing is announced. */}
      <span className="sr-only" role="status">
        {plan
          ? t("Your plan is ready", "计划已准备就绪")
          : t("Your assistant is writing your plan", "助手正在制定计划")}
      </span>
      {plan ? (
        <PlanBody plan={plan} moment={moment} />
      ) : (
        <PlanSkeleton progress={progress} />
      )}
      {footer}
    </div>
  );
}

function PlanBody({
  plan,
  moment,
}: {
  plan: PlanResponse;
  moment: ConsentMoment;
}) {
  const { t } = useTranslation();
  const role = useOnboardingWizardStore((s) => s.role);
  const team = plan.team ?? [];
  const heard = plan.source === "llm" ? plan.heard : null;
  return (
    <>
      <HeardCard
        label={
          heard
            ? t("What I heard", "我了解到的情况")
            : t("Based on your role", "根据你的角色")
        }
        text={
          heard ??
          t(
            roleHeard({ role, skippedDump: plan.skipped_dump }),
            `${plan.skipped_dump ? "你跳过了工作描述，" : ""}这是根据你的角色拟定的初步计划。开始使用后，告诉我更多工作情况，我会进一步完善。`,
          )
        }
      />
      <ul
        aria-label={t("Your first tasks", "首批任务")}
        className="flex flex-col gap-2"
      >
        {getStepTasks(plan).map((task, index) => (
          <PlanTaskCard
            key={task.id}
            task={task}
            owner={getTaskOwner(task, team)}
            isFirst={index === 0}
          />
        ))}
      </ul>
      <PlanConsentLine team={team} moment={moment} />
    </>
  );
}

function HeardCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border-base bg-surface px-3.5 py-2.5">
      <Text variant="eyebrow" as="p" className="mb-1">
        {label}
      </Text>
      <Text variant="body" as="p" tone="secondary" className="text-pretty">
        {text}
      </Text>
    </div>
  );
}

// Sized like the plan it stands in for, so the card does not jump when the
// plan lands: the heard card (here, what the server is doing), three task
// cards, then the consent line.
function PlanSkeleton({ progress }: { progress?: PlanProgress | null }) {
  return (
    <div
      data-testid="plan-panel-pending"
      className="flex flex-col gap-3.5 [@media(max-height:780px)]:gap-2.5"
      aria-busy
    >
      {/* Only what the server reports: a skip that has not landed yet
          would otherwise read as a brain dump being turned into tasks. */}
      {progress ? (
        <PlanProgressCard progress={progress} />
      ) : (
        <Skeleton className="h-[5.375rem] rounded-2xl" />
      )}
      <div className="flex flex-col gap-2">
        {Array.from({ length: PLAN_STEP_TASKS }, (_, index) => (
          <Skeleton key={index} className="h-[6.75rem] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-8 w-4/5 rounded-lg" />
    </div>
  );
}
