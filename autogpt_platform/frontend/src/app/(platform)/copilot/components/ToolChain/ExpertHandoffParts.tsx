"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { cn } from "@/lib/utils";
import {
  type HandoffTask,
  NEW_EXPERT_COPY,
  type NewExpertKind,
} from "./expertHandoff";

interface ProposalProps {
  /** A hire off the roster or a new expert: the card says hire or create. */
  kind: NewExpertKind;
  name: string;
  avatarUrl: string | null;
  color: string | null;
  /** One line about the expert, written for the user. */
  about: string | null;
  task: HandoffTask;
  /** Absent once answered, or on a read-only transcript. */
  actions: {
    onStart: () => void;
    onNotNow: () => void;
    disabled: boolean;
  } | null;
  /** Opens the full charter in the side panel, where there is one. */
  onShowProfile?: () => void;
  /** Classes that slide the identity in when a pager moves. */
  stepClassName?: string;
  stepKey: string;
}

/** A hire or new expert proposed for a task the user already described,
 *  asked as one yes/no question: Hire (or Create) and start, or Not now. The
 *  brief and the expert's charter stay behind one disclosure: the user wrote
 *  the task a moment ago and only needs who, what and the choice to answer. */
export function HandoffProposal({
  kind,
  name,
  avatarUrl,
  color,
  about,
  task,
  actions,
  onShowProfile,
  stepClassName,
  stepKey,
}: ProposalProps) {
  const { t } = useTranslation();
  const copy = NEW_EXPERT_COPY[kind];
  return (
    <div className="flex gap-3 p-4">
      <ExpertAvatar
        key={`${stepKey}-avatar`}
        name={name}
        avatarUrl={avatarUrl}
        color={color}
        size={40}
      />
      <div className="min-w-0 flex-1">
        <div key={stepKey} className={stepClassName}>
          <p className="text-body leading-snug font-medium [overflow-wrap:anywhere] text-foreground-emphasis">
            {t(
              `${copy.Verb} ${name} to take on ${task.title}?`,
              `${kind === "raise" ? "创建" : "聘用"} ${name} 来处理“${task.title}”？`,
            )}
          </p>
          <p className="mt-0.5 text-body [overflow-wrap:anywhere] text-foreground-tertiary">
            {t("Works on it in their own chat", "在自己的对话中处理任务")}
          </p>
        </div>
        {actions && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="row"
              disabled={actions.disabled}
              onClick={actions.onStart}
            >
              {t(
                `${copy.Verb} and start`,
                `${kind === "raise" ? "创建" : "聘用"}并开始`,
              )}
            </Button>
            <Button
              variant="ghost"
              size="row"
              disabled={actions.disabled}
              onClick={actions.onNotNow}
            >
              {t("Not now", "暂不")}
            </Button>
          </div>
        )}
        <HandoffDetails
          name={name}
          about={about}
          task={task}
          onShowProfile={onShowProfile}
        />
      </div>
    </div>
  );
}

interface DetailsProps {
  name: string;
  about: string | null;
  task: HandoffTask;
  onShowProfile?: () => void;
}

function HandoffDetails({ name, about, task, onShowProfile }: DetailsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded text-caption font-medium text-foreground-secondary underline-offset-2 hover:underline focus-visible:ring-1 focus-visible:ring-focus focus-visible:outline-none"
      >
        {t(`What ${name} will get`, `${name} 将收到的内容`)}
        <Icon
          icon={ArrowDown01Icon}
          size={12}
          aria-hidden
          motion="transform"
          className={cn(open && "rotate-180")}
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className={cn("mt-2 flex-col gap-2", open ? "flex" : "hidden")}
      >
        <p className="rounded-2xl bg-surface-muted px-3 py-2.5 text-body [overflow-wrap:anywhere] whitespace-pre-line text-foreground-tertiary">
          {task.brief}
        </p>
        {about && (
          <p className="text-caption [overflow-wrap:anywhere] text-foreground-subtle">
            {t(`About ${name}: ${about}`, `关于 ${name}：${about}`)}
          </p>
        )}
        {onShowProfile && (
          <button
            type="button"
            onClick={onShowProfile}
            className="self-start rounded text-caption font-medium text-foreground-secondary underline-offset-2 hover:underline focus-visible:ring-1 focus-visible:ring-focus focus-visible:outline-none"
          >
            {t(`See ${name}'s full profile`, `查看 ${name} 的完整档案`)}
          </button>
        )}
      </div>
    </div>
  );
}

interface ReceiptProps {
  children: ReactNode;
}

/** What an answered hand-off card shrinks to: the record of the choice. */
export function HandoffReceipt({ children }: ReceiptProps) {
  return (
    <p className="flex items-center gap-2 text-body text-foreground-tertiary">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted">
        <Icon icon={Tick02Icon} size={12} aria-hidden />
      </span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </p>
  );
}
