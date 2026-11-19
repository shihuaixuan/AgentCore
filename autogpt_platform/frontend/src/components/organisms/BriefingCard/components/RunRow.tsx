"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { BriefingRunItem } from "@/app/api/__generated__/models/briefingRunItem";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { AttentionCard } from "@/components/organisms/AttentionCard/AttentionCard";
import type { CardExpert } from "@/components/organisms/PendingReviewsList/expertIdentity";
import { getSafeLink, getSubtitleParts } from "../helpers";

interface Props {
  item: BriefingRunItem;
  expert: CardExpert;
  isHidden?: boolean;
}

// One row per run: the summary doubles as the row's subtitle, so the agent
// attribution and its finding read as a single line.
export function RunRow({ item, expert, isHidden = false }: Props) {
  const { t } = useTranslation();
  const isFailed = item.status !== "COMPLETED";
  const { attribution, text } = getSubtitleParts(item.summary, expert.title);
  const link = getSafeLink(item.link);

  const body = (
    <>
      <AttentionCard.Icon>
        <ExpertAvatar
          name={expert.title}
          avatarUrl={expert.avatarURL}
          size={28}
        />
      </AttentionCard.Icon>
      <AttentionCard.Content data-slot="briefing-card-run-row-body">
        <div
          data-slot="briefing-card-run-row-header"
          className="flex items-center gap-2"
        >
          <Text variant="body-medium" tone="primary" className="truncate">
            {item.agent_name}
          </Text>
          {isFailed ? (
            <span
              data-slot="briefing-card-run-row-status"
              className="shrink-0 rounded-full bg-error-surface px-2 py-0.5 text-caption-sm leading-inherit font-medium text-error-foreground"
            >
              {t("Failed", "失败")}
            </span>
          ) : null}
        </div>
        {text ? (
          <Text variant="body" tone="muted" className="line-clamp-2">
            {/* Attribution matters once more than one agent reports:
                mirrors the thread markdown's "**{agent}**: {summary}". */}
            {attribution ? (
              <span
                data-slot="briefing-card-run-row-attribution"
                className="text-foreground-subtle"
              >
                {attribution} ·{" "}
              </span>
            ) : null}
            {text}
          </Text>
        ) : null}
      </AttentionCard.Content>
      {link ? (
        <AttentionCard.Icon trailing>
          <Icon icon={ArrowRight01Icon} size={16} />
        </AttentionCard.Icon>
      ) : null}
    </>
  );

  // Collapsed rows stay mounted and are clipped by the list's overflow, so
  // without this they keep their place in the tab order and focus lands on
  // rows the reader cannot see.
  return (
    <li data-slot="briefing-card-run-row" aria-hidden={isHidden || undefined}>
      {link ? (
        <AttentionCard.Row asChild align="start" inset interactive>
          <Link
            href={link}
            tabIndex={isHidden ? -1 : undefined}
            data-slot="briefing-card-run-row-content"
          >
            {body}
          </Link>
        </AttentionCard.Row>
      ) : (
        <AttentionCard.Row
          align="start"
          inset
          data-slot="briefing-card-run-row-content"
        >
          {body}
        </AttentionCard.Row>
      )}
    </li>
  );
}
