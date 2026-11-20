"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/molecules/Popover/Popover";
import { ApprovalFields } from "@/components/organisms/ApprovalFields/ApprovalFields";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import { HIDDEN_FROM_REPLAY } from "@/lib/replay-privacy";
import { cn } from "@/lib/utils";
import { approvalCardId } from "../ApprovalQueue/helpers";
import type { HeldRowInfo, HeldState } from "./heldRow";

const TAGS: Record<HeldState, { text: string; className: string }> = {
  waiting: {
    text: "Waiting for you",
    className: "bg-warning-surface text-warning-foreground",
  },
  approved: {
    text: "Approved",
    className: "bg-surface-hover text-foreground-tertiary",
  },
  rejected: {
    text: "Rejected",
    className: "bg-surface-hover text-foreground-tertiary",
  },
  expired: {
    text: "Expired",
    className: "bg-surface-hover text-foreground-tertiary",
  },
  closed: {
    text: "Not run",
    className: "bg-surface-hover text-foreground-tertiary",
  },
  unknown: {
    text: "Unclear",
    className: "bg-warning-surface text-warning-foreground",
  },
  "not-run": {
    text: "Not run",
    className: "bg-error-surface text-error-foreground",
  },
};

// A held read is released or kept out, not approved or rejected.
const READ_TAGS: Partial<Record<HeldState, string>> = {
  waiting: "Held",
  approved: "Released",
  rejected: "Kept out",
};

export function HeldTag({ state, read }: { state: HeldState; read?: boolean }) {
  const { t } = useTranslation();
  const tag = TAGS[state];
  const text = (read && READ_TAGS[state]) || tag.text;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-px text-caption font-medium",
        tag.className,
      )}
    >
      {state === "approved" && <Icon icon={Tick02Icon} size={11} aria-hidden />}
      {t(
        text,
        read && state === "waiting"
          ? "已暂缓"
          : read && state === "approved"
            ? "已放行"
            : read && state === "rejected"
              ? "已屏蔽"
              : (
                  {
                    waiting: "等待你处理",
                    approved: "已批准",
                    rejected: "已拒绝",
                    expired: "已过期",
                    closed: "未执行",
                    unknown: "状态不明",
                    "not-run": "未执行",
                  } as Record<HeldState, string>
                )[state],
      )}
    </span>
  );
}

export function HeldApprovalBadge({ held }: { held: HeldRowInfo }) {
  const badge = <HeldTag state={held.state} read={held.read} />;
  if (!held.card) return badge;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-focus"
        >
          {badge}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={12}>
        <div className={HIDDEN_FROM_REPLAY}>
          <HeldArguments card={held.card} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HeldArguments({ card }: { card: NonNullable<HeldRowInfo["card"]> }) {
  return (
    <ApprovalFields
      fields={card.fields}
      values={card.args}
      clipped={card.clipped}
      idsWhenAlone
    />
  );
}

const DETAIL: Record<Exclude<HeldState, "approved">, string> = {
  waiting: `Nothing has run yet. ${AUTOPILOT_NAME} carried on without it.`,
  rejected: `You rejected this, so it didn't run. ${AUTOPILOT_NAME} was told.`,
  expired: `Approved, but it didn't run within an hour, so the approval lapsed. Ask ${AUTOPILOT_NAME} to try again.`,
  unknown: `It may have run, but its result was lost. Check before relying on it.`,
  closed: `It couldn't be carried out, so nothing ran. Ask ${AUTOPILOT_NAME} to try again if it's still needed.`,
  "not-run": `${AUTOPILOT_NAME} couldn't open an approval for this, so nothing ran.`,
};

const READ_DETAIL: Partial<Record<HeldState, string>> = {
  waiting: `Nothing from it has reached ${AUTOPILOT_NAME} yet. ${AUTOPILOT_NAME} carried on without it.`,
  rejected: `You kept this out, so ${AUTOPILOT_NAME} never saw it.`,
  unknown: `It isn't clear whether this reached ${AUTOPILOT_NAME}. Check before relying on it.`,
};

interface HeldCallDetailProps {
  held: HeldRowInfo;
  showArgs?: boolean;
}

export function HeldCallDetail({ held, showArgs = true }: HeldCallDetailProps) {
  const { t } = useTranslation();
  const card = showArgs ? held.card : undefined;
  if (held.state === "approved" && !card) return null;
  const reviewId = held.reviewId;
  function goToApproval() {
    if (!reviewId) return;
    const el = document.getElementById(approvalCardId(reviewId));
    el?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    el?.focus({ preventScroll: true });
  }
  return (
    <div className="flex flex-col items-start gap-1 rounded-lg border border-border-base px-3 py-2 text-body text-foreground-secondary">
      {held.state !== "approved" && (
        <p>
          {t(
            (held.read && READ_DETAIL[held.state]) || DETAIL[held.state],
            held.read && held.state === "waiting"
              ? `其中的内容尚未传给 ${AUTOPILOT_NAME}。${AUTOPILOT_NAME} 已继续处理其他工作。`
              : held.read && held.state === "rejected"
                ? `你已屏蔽此内容，因此 ${AUTOPILOT_NAME} 从未看到它。`
                : held.read && held.state === "unknown"
                  ? `无法确定此内容是否已传给 ${AUTOPILOT_NAME}，请先核实再使用。`
                  : {
                      waiting: `尚未执行任何操作。${AUTOPILOT_NAME} 已继续处理其他工作。`,
                      rejected: `你已拒绝，因此未执行。已通知 ${AUTOPILOT_NAME}。`,
                      expired: `虽已批准，但一小时内未执行，批准已失效。请让 ${AUTOPILOT_NAME} 重试。`,
                      unknown: "可能已执行，但结果丢失。请先核实再使用。",
                      closed: `无法完成，因此未执行。如仍需要，请让 ${AUTOPILOT_NAME} 重试。`,
                      "not-run": `${AUTOPILOT_NAME} 无法发起审批，因此未执行。`,
                    }[held.state],
          )}
        </p>
      )}
      {card && (
        <div className="w-full py-1">
          <HeldArguments card={card} />
        </div>
      )}
      {held.state === "waiting" && reviewId && (
        <Button variant="link" size="inline" onClick={goToApproval}>
          {t("Go to the approval", "前往审批")}
        </Button>
      )}
    </div>
  );
}
