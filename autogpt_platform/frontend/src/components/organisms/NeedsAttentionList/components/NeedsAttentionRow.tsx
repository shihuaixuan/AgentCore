"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { useState } from "react";
import type { PendingHumanReviewModel } from "@/app/api/__generated__/models/pendingHumanReviewModel";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { AttentionCard } from "@/components/organisms/AttentionCard/AttentionCard";
import { getReviewLink } from "@/lib/review-links";
import { getReviewTitle } from "../helpers";

interface Props {
  review: PendingHumanReviewModel;
  isProcessing: boolean;
  onApprove: (review: PendingHumanReviewModel) => void;
  onDecline: (review: PendingHumanReviewModel) => void;
}

export function NeedsAttentionRow({
  review,
  isProcessing,
  onApprove,
  onDecline,
}: Props) {
  const { t, locale } = useTranslation();
  // Decline rejects the agent's action outright, with no undo, in a flow
  // built for fast tapping — so it takes a second, deliberate tap.
  const [isConfirmingDecline, setIsConfirmingDecline] = useState(false);
  const title = getReviewTitle(review, locale);
  const subtitle = [review.expert_name, review.agent_name]
    .filter(Boolean)
    .join(" · ");

  function handleDecline() {
    if (!isConfirmingDecline) {
      setIsConfirmingDecline(true);
      return;
    }
    setIsConfirmingDecline(false);
    onDecline(review);
  }

  return (
    <AttentionCard.Root
      variant="default"
      density="default"
      data-slot="needs-attention-row"
    >
      <AttentionCard.Row align="center">
        <AttentionCard.Icon>
          <ExpertAvatar
            name={review.expert_name ?? null}
            avatarUrl={review.expert_avatar_url ?? null}
          />
        </AttentionCard.Icon>
        <AttentionCard.Content asChild>
          <Link
            href={getReviewLink(review)}
            data-slot="needs-attention-row-link"
          >
            <Text variant="body-medium" className="truncate">
              {title}
            </Text>
            {subtitle ? (
              <Text variant="small" tone="muted" className="truncate">
                {subtitle}
              </Text>
            ) : null}
          </Link>
        </AttentionCard.Content>
        <AttentionCard.Actions
          placement="inline"
          data-slot="needs-attention-row-actions"
        >
          <Button
            variant="primary"
            size="small"
            disabled={isProcessing}
            aria-label={t(`Approve: ${title}`, `批准：${title}`)}
            onClick={() => onApprove(review)}
          >
            {t("Approve", "批准")}
          </Button>
          <Button
            // The armed state carries the destructive colour as well as the
            // label: in a fast-tapping flow a word swap alone is easy to miss,
            // and the next tap has no undo.
            variant={isConfirmingDecline ? "destructive" : "ghost"}
            size="small"
            disabled={isProcessing}
            aria-label={
              isConfirmingDecline
                ? t(`Confirm decline: ${title}`, `确认拒绝：${title}`)
                : t(`Decline: ${title}`, `拒绝：${title}`)
            }
            onClick={handleDecline}
            onBlur={() => setIsConfirmingDecline(false)}
          >
            {isConfirmingDecline ? t("Confirm", "确认") : t("Decline", "拒绝")}
          </Button>
        </AttentionCard.Actions>
        <span
          aria-live="polite"
          data-slot="needs-attention-row-announcement"
          className="sr-only"
        >
          {isConfirmingDecline
            ? t(`Tap again to decline: ${title}`, `再次点击以拒绝：${title}`)
            : ""}
        </span>
      </AttentionCard.Row>
    </AttentionCard.Root>
  );
}
