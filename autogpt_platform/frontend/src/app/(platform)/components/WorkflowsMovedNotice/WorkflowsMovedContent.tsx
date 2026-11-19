"use client";

import { Button } from "@/components/atoms/Button/Button";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import * as Dialog from "@radix-ui/react-dialog";
import { RefObject } from "react";
import { WorkflowsMovedWalkthrough } from "./WorkflowsMovedWalkthrough";

interface Props {
  titleRef: RefObject<HTMLHeadingElement | null>;
  onDismiss: () => void;
}

export function WorkflowsMovedContent({ titleRef, onDismiss }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="px-6 pt-5 pb-3 sm:px-8">
          <p className="mb-1.5 text-caption font-medium tracking-widest text-accent-strong uppercase">
            {t("Workspace update", "工作区更新")}
          </p>
          <Dialog.Title
            ref={titleRef}
            tabIndex={-1}
            className="pr-7 text-heading-md leading-tight font-semibold tracking-tight text-foreground-strong outline-none sm:text-heading sm:leading-tight"
          >
            {t("Your agents have moved", "你的智能体已迁移")}
          </Dialog.Title>
          <Dialog.Description className="mt-1.5 text-body leading-relaxed text-foreground-secondary">
            {t("Agents are now ", "智能体现已更名为“")}
            <strong className="font-medium text-foreground-strong">
              {t("workflows", "工作流")}
            </strong>
            {t(". Find yours under ", "”。你可以在团队页面的 ")}
            <strong className="font-medium text-foreground-strong">Otto</strong>
            {t(" in Team.", " 下找到你的工作流。")}
          </Dialog.Description>
          <WorkflowLocation />
        </div>
        <div className="px-4 pb-3 sm:px-6">
          <WorkflowsMovedWalkthrough />
        </div>
      </div>
      <WorkflowsMovedActions onDismiss={onDismiss} />
    </>
  );
}

function WorkflowsMovedActions({ onDismiss }: Pick<Props, "onDismiss">) {
  const { t } = useTranslation();
  return (
    <div className="shrink-0 border-t border-separator bg-surface px-6 py-2 sm:px-8">
      <p className="mb-1.5 text-caption leading-none text-foreground-tertiary">
        {t("Nothing to set up again.", "无需重新设置。")}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          as="NextLink"
          href="/team/autopilot?tab=workflows"
          onClick={onDismiss}
          rightIcon={<Icon icon={ArrowRight02Icon} size={18} aria-hidden />}
        >
          {t("Go to my workflows", "前往我的工作流")}
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          {t("Got it", "知道了")}
        </Button>
      </div>
    </div>
  );
}

function WorkflowLocation() {
  const { t } = useTranslation();
  return (
    <ol
      aria-label={t("Where to find your workflows", "工作流位置")}
      className="mt-3 flex w-fit flex-wrap items-center gap-2 rounded-full border border-border-base/80 bg-surface-muted px-3 py-1 text-caption text-foreground-secondary"
    >
      {[t("Team", "团队"), "Otto", t("Workflows", "工作流")].map(
        (label, index) => (
          <li key={label} className="flex items-center gap-2">
            {index > 0 && (
              <Icon
                icon={ArrowRight02Icon}
                size={12}
                tone="subtle"
                aria-hidden
              />
            )}
            <span
              className={
                index === 2 ? "font-medium text-accent-strong" : undefined
              }
            >
              {label}
            </span>
          </li>
        ),
      )}
    </ol>
  );
}
