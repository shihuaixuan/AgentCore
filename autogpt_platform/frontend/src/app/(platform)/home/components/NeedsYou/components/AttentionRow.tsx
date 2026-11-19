"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  AlertCircleIcon,
  CoinsDollarIcon,
  MessageQuestionIcon,
  PauseIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { useState } from "react";
import type { HomeAttentionItem } from "@/app/api/__generated__/models/homeAttentionItem";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  isGateReview,
  isHeldRead,
  reasonLine,
} from "@/app/(platform)/copilot/components/ApprovalQueue/helpers";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import {
  getAttentionDescription,
  getAttentionTitle,
  getHeldCallTitle,
  toHomeApprovalItem,
} from "../attentionCopy";
import { AttentionRowActions } from "./AttentionRowActions";
import { HeldPassageQuote } from "./HeldPassageQuote";

interface Props {
  item: HomeAttentionItem;
  isProcessing: boolean;
  onDecision: (item: HomeAttentionItem, approved: boolean) => void;
}

const ICONS: Record<HomeAttentionItem["kind"], IconSvgElement> = {
  approval: AlertCircleIcon,
  setup: Settings02Icon,
  paused: PauseIcon,
  credits: CoinsDollarIcon,
  question: MessageQuestionIcon,
};

export function AttentionRow({ item, isProcessing, onDecision }: Props) {
  const { t, locale } = useTranslation();
  const [confirmDecline, setConfirmDecline] = useState(false);
  const expertTitle = item.expert
    ? getExpertDisplayTitle(item.expert, locale)
    : null;
  const approval =
    item.review && isGateReview(item.review)
      ? toHomeApprovalItem(item.review, item.expert, locale)
      : null;
  const read = approval && isHeldRead(approval) ? approval : null;
  const title = read
    ? getHeldCallTitle(item, read, locale)
    : getAttentionTitle(item, expertTitle, t);
  const description =
    (approval && reasonLine(approval, locale)) ??
    getAttentionDescription(item, expertTitle, t);

  function handleDecline() {
    if (!confirmDecline) {
      setConfirmDecline(true);
      return;
    }
    setConfirmDecline(false);
    onDecision(item, false);
  }

  return (
    <article className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {item.expert ? (
          <ExpertAvatar
            name={expertTitle}
            avatarUrl={item.expert.avatar_url}
            size={48}
          />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-hover text-foreground-tertiary">
            <Icon icon={ICONS[item.kind]} size={22} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="body-medium" tone="primary" className="text-pretty">
              <AttentionTitle title={title} headline={item.headline} />
            </Text>
            {item.priority === "high" ? (
              <span className="rounded bg-warning-surface px-1.5 py-px ring-1 ring-warning-foreground/10 ring-inset">
                <Text
                  variant="small-medium"
                  tone="warning"
                  as="span"
                  className="block"
                >
                  {t("Waiting", "等待中")}
                </Text>
              </span>
            ) : null}
          </div>
          <Text
            variant="body"
            tone="secondary"
            className="text-pretty break-words"
          >
            {description}
          </Text>
          {read?.passage ? <HeldPassageQuote passage={read.passage} /> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
        <AttentionRowActions
          item={item}
          title={title}
          isProcessing={isProcessing}
          confirmDecline={confirmDecline}
          onApprove={() => onDecision(item, true)}
          onDecline={handleDecline}
          onDeclineBlur={() => setConfirmDecline(false)}
        />
      </div>
      <span className="sr-only" aria-live="polite">
        {confirmDecline
          ? t(`Press again to decline ${title}`, `再次点击以拒绝 ${title}`)
          : ""}
      </span>
    </article>
  );
}

// A held call's object is set in semibold, as on its card in the chat.
function AttentionTitle({
  title,
  headline,
}: {
  title: string;
  headline: HomeAttentionItem["headline"];
}) {
  if (!headline?.object) return <>{title}</>;
  return (
    <>
      {headline.ask}{" "}
      <b className="font-semibold" translate="no">
        {headline.object}
      </b>
    </>
  );
}
