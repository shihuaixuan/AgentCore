"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import NextLink from "next/link";
import { Icon } from "@/components/atoms/Icon/Icon";
import {
  frozenStatusOf,
  type HandoffOutcome,
  type HandoffState,
  handoffStateOf,
  NEW_EXPERT_COPY,
  type NewExpertKind,
  possessive,
} from "./expertHandoff";
import { HandoffRetry } from "./HandoffRetry";
import { StatusAvatar } from "./HandoffStatusAvatar";
import { useSubSessionEffectiveStatus } from "./SubSessionLive";

interface Props {
  outcome: HandoffOutcome;
  /** Whether the expert was hired or created, for the failed line. */
  kind: NewExpertKind;
  name: string;
  /** The hire; absent on outputs that don't carry it. */
  expertId: string | null;
  avatarUrl: string | null;
  color: string | null;
  /** Sends a chat message; absent on a read-only transcript. */
  onSend?: (message: string) => void;
}

/** Where the task went once the hire and hand-off landed. The confirm only
 *  queued it, so this follows the expert's thread from there. While the work
 *  is in flight it is a card; once it is over it recedes to one line. The
 *  hire itself needs no card of its own: the answered proposal above already
 *  records it. */
export function HandoffStatus({
  outcome,
  kind,
  name,
  expertId,
  avatarUrl,
  color,
  onSend,
}: Props) {
  const { t } = useTranslation();
  const live = useSubSessionEffectiveStatus(
    outcome.subSessionId,
    frozenStatusOf(outcome),
  );
  const state = handoffStateOf(outcome, live);
  const unknown = state === "unknown";
  const avatar = (size: number) => (
    <StatusAvatar
      name={name}
      avatarUrl={avatarUrl}
      color={color}
      state={state}
      size={size}
    />
  );

  if (state === "waiting" || state === "working" || unknown) {
    return (
      <div className="w-full overflow-hidden rounded-3xl border border-separator bg-surface">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          {avatar(32)}
          <p className="min-w-[min(100%,14rem)] flex-1 text-body [overflow-wrap:anywhere] text-foreground-secondary">
            <HandoffSentence
              outcome={outcome}
              kind={kind}
              name={name}
              state={state}
            />
          </p>
          {unknown && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-surface-hover px-2 py-0.5 text-caption-sm leading-inherit font-medium text-foreground-tertiary">
              {t("Status unknown", "状态未知")}
            </span>
          )}
          {outcome.link && (
            <NextLink
              href={outcome.link}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-base bg-surface px-3 py-1.5 text-body font-medium text-foreground-emphasis shadow-sm transition-colors hover:border-border-strong hover:bg-surface-muted focus-visible:ring-1 focus-visible:ring-focus focus-visible:outline-none"
            >
              {t(`Open ${possessive(name)} chat`, `打开与 ${name} 的对话`)}
              <Icon
                icon={ArrowUpRight01Icon}
                size={14}
                aria-hidden
                className="rtl:-scale-x-100"
              />
            </NextLink>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      {avatar(24)}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 pt-0.5">
        <p
          role={state === "failed" ? "status" : undefined}
          className="min-w-0 text-body [overflow-wrap:anywhere] text-foreground-secondary"
        >
          <HandoffSentence
            outcome={outcome}
            kind={kind}
            name={name}
            state={state}
          />
        </p>
        {state === "failed"
          ? outcome.retry &&
            onSend &&
            expertId && (
              <HandoffRetry
                title={outcome.title}
                name={name}
                expertId={expertId}
                onSend={onSend}
              />
            )
          : outcome.link && (
              <NextLink
                href={outcome.link}
                className="inline-flex shrink-0 items-center gap-1 rounded text-body font-medium text-foreground-emphasis underline-offset-2 hover:underline focus-visible:ring-1 focus-visible:ring-focus focus-visible:outline-none"
              >
                {t(`Open ${possessive(name)} chat`, `打开与 ${name} 的对话`)}
                <Icon
                  icon={ArrowUpRight01Icon}
                  size={14}
                  aria-hidden
                  className="rtl:-scale-x-100"
                />
              </NextLink>
            )}
      </div>
    </div>
  );
}

interface SentenceProps {
  outcome: HandoffOutcome;
  kind: NewExpertKind;
  name: string;
  state: HandoffState;
}

function HandoffSentence({ outcome, kind, name, state }: SentenceProps) {
  const { t } = useTranslation();
  switch (state) {
    case "failed":
      return (
        <>
          {t(
            `${name} is ${NEW_EXPERT_COPY[kind].done}, but ${outcome.title} didn't start.`,
            `${name} 已${kind === "raise" ? "创建" : "聘用"}，但“${outcome.title}”尚未开始。`,
          )}
        </>
      );
    case "unconfirmed":
      return (
        <>
          {t(
            `${outcome.title} may have started in ${possessive(name)} chat. Open it to check.`,
            `“${outcome.title}”可能已在 ${name} 的对话中开始，请打开对话确认。`,
          )}
        </>
      );
    // An idle thread holds a result, a question for the user or an error;
    // the poll can't tell which, so the line doesn't guess.
    case "stopped":
      return (
        <>
          {t(
            `${name} stopped working on ${outcome.title}. Their chat has the result, or a question for you.`,
            `${name} 已停止处理“${outcome.title}”。其对话中有结果或需要你回答的问题。`,
          )}
        </>
      );
    case "waiting":
      return (
        <>
          {t(
            `${name} starts on ${outcome.title} as soon as one of your other tasks finishes.`,
            `你的其他任务之一完成后，${name} 就会开始处理“${outcome.title}”。`,
          )}
        </>
      );
    case "working":
      return (
        <>
          {t(
            `${name} is working on ${outcome.title}.`,
            `${name} 正在处理“${outcome.title}”。`,
          )}
        </>
      );
    // The live status can't be read: say only what is known.
    case "unknown":
      return (
        <>
          {t(
            `Sent ${outcome.title} to ${name}. Open their chat to see where it stands.`,
            `已将“${outcome.title}”发送给 ${name}。请打开其对话查看进展。`,
          )}
        </>
      );
  }
}
