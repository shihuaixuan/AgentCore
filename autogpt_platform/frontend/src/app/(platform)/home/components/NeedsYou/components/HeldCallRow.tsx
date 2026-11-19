"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import type { HomeAttentionItem } from "@/app/api/__generated__/models/homeAttentionItem";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import type { Tone } from "@/components/styles/tones";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import type { CardStatus } from "@/app/(platform)/copilot/components/ApprovalQueue/components/ApprovalCard/ApprovalCard";
import { HeadlineText } from "@/app/(platform)/copilot/components/ApprovalQueue/components/ApprovalHeadline";
import {
  type ApprovalItem,
  isHeldRead,
  modeLabel,
  reasonLine,
} from "@/app/(platform)/copilot/components/ApprovalQueue/helpers";
import { getHeldCallTitle } from "../attentionCopy";
import { headlineButtonId, isInformed, shortAge } from "../helpers";
import { HeldAvatar } from "./HeldAvatar";
import { HeldPassageQuote } from "./HeldPassageQuote";

interface Props {
  item: HomeAttentionItem;
  approval: ApprovalItem;
  status: CardStatus;
  failed: boolean;
  avatarSize: number | null;
  onOpen: () => void;
  onDecide: (approved: boolean) => void;
}

export function HeldCallRow({
  item,
  approval,
  status,
  failed,
  avatarSize,
  onOpen,
  onDecide,
}: Props) {
  const { t, locale } = useTranslation();
  const [confirmReject, setConfirmReject] = useState(false);
  const read = isHeldRead(approval);
  const title = getHeldCallTitle(item, approval, locale);
  const reason = reasonLine(approval, locale);
  const mode = approval.reasonKind === "mode" ? modeLabel(approval.mode) : null;
  const busy = status !== "idle";
  const approveLabel = read ? t("Release", "放行") : t("Approve", "批准");

  function handleReject() {
    if (!confirmReject) {
      setConfirmReject(true);
      return;
    }
    setConfirmReject(false);
    onDecide(false);
  }

  return (
    <article
      aria-busy={busy}
      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {avatarSize ? <HeldAvatar item={item} size={avatarSize} /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <button
              type="button"
              id={headlineButtonId(item.id)}
              aria-haspopup="dialog"
              onClick={onOpen}
              className="line-clamp-2 min-w-0 rounded-md text-left [overflow-wrap:anywhere] text-foreground-strong hover:opacity-80 focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:outline-none"
            >
              <Text variant="body-medium" as="span" className="text-pretty">
                <HeadlineText item={approval} />
              </Text>
            </button>
            {approval.subject.irreversible && (
              <Tag tone="error-strong" className="bg-error-surface">
                {t("Can't be undone", "无法撤销")}
              </Tag>
            )}
            {mode && (
              <Tag tone="secondary" className="bg-surface-hover">
                {mode}
              </Tag>
            )}
            {item.priority === "high" && (
              <Tag
                tone="warning"
                className="bg-warning-surface ring-1 ring-warning-foreground/10 ring-inset"
              >
                {t("Waiting", "等待中")}
              </Tag>
            )}
          </div>
          {failed ? (
            <Text variant="body" role="alert" tone="error-strong">
              {t(
                "Couldn't send your answer. Nothing ran. Try again.",
                "无法发送你的回复，尚未执行任何操作。请重试。",
              )}
            </Text>
          ) : reason ? (
            <Text
              variant="body"
              tone="secondary"
              className="text-pretty break-words"
            >
              {reason}
            </Text>
          ) : null}
          {read && approval.passage ? (
            <HeldPassageQuote
              passage={approval.passage}
              clamp={!isInformed(approval)}
            />
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
        {item.created_at ? (
          <Text
            variant="small"
            as="span"
            tone="secondary"
            tabular
            className="mr-1 hidden sm:inline"
          >
            <time dateTime={new Date(item.created_at).toISOString()}>
              {shortAge(item.created_at, undefined, locale)}
            </time>
          </Text>
        ) : null}
        {isInformed(approval) ? (
          <Button
            variant="primary"
            size="icon-sm"
            leadingIcon={Tick02Icon}
            loading={status === "approving"}
            disabled={busy}
            aria-label={`${approveLabel}: ${title}`}
            onClick={() => onDecide(true)}
          />
        ) : (
          <Button
            variant="secondary"
            size="row"
            disabled={busy}
            aria-label={t(`Review: ${title}`, `审核：${title}`)}
            onClick={onOpen}
          >
            {t("Review", "审核")}
          </Button>
        )}
        <Button
          variant={confirmReject ? "destructive" : "icon"}
          size="icon-sm"
          leadingIcon={Cancel01Icon}
          loading={status === "rejecting"}
          disabled={busy}
          aria-label={t(
            `${confirmReject ? `Confirm ${read ? "keep it out" : "reject"}` : read ? "Keep it out" : "Reject"}: ${title}`,
            `${confirmReject ? "确认" : ""}${read ? "拦截" : "拒绝"}：${title}`,
          )}
          onClick={handleReject}
          onBlur={() => setConfirmReject(false)}
        />
      </div>
      <span className="sr-only" aria-live="polite">
        {confirmReject
          ? t(
              `Press again to ${read ? "keep it out" : "reject"} ${title}. ${read ? approval.reader : AUTOPILOT_NAME} will be told it didn't run.`,
              `再次点击以${read ? "拦截" : "拒绝"} ${title}。系统将告知 ${read ? approval.reader : AUTOPILOT_NAME} 此操作未执行。`,
            )
          : ""}
      </span>
    </article>
  );
}

function Tag({
  tone,
  className,
  children,
}: {
  tone: Tone;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`shrink-0 rounded px-1.5 py-px ${className}`}>
      <Text variant="small-medium" as="span" tone={tone} className="block">
        {children}
      </Text>
    </span>
  );
}
