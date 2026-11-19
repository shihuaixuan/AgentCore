"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { cn } from "@/lib/utils";
import { CARD } from "./ResultCards";
import { asObject, str, unescapePromptTags } from "./resultHelpers";

interface Props {
  output: Record<string, unknown>;
}

interface VerdictStyle {
  label: string;
  icon: IconSvgElement;
  chip: string;
}

const VERDICTS: Record<string, VerdictStyle> = {
  pass: {
    label: "No objection",
    icon: CheckmarkCircle02Icon,
    chip: "bg-success-surface text-success-foreground",
  },
  block: {
    label: "Blocked",
    icon: Alert02Icon,
    chip: "bg-error-surface text-error-foreground",
  },
  insufficient: {
    label: "Not checked",
    icon: HelpCircleIcon,
    chip: "bg-warning-surface text-warning-foreground",
  },
};

/** One teammate's ruling on another's draft. The quoted lines are the point of
 *  the card: they are what the user reads to decide whether the objection was
 *  right, and whether an override in the reply below it was honest.
 *
 *  `reason` and `quotes` are model output conditioned on a user-editable Soul,
 *  so they render as plain text — never markdown, never HTML. The backend
 *  tag-escapes them for the model; the card shows them as written. */
export function ConsultVerdictCard({ output }: Props) {
  const { t, locale } = useTranslation();
  const verdict = str(output, "verdict") ?? "";
  const style = VERDICTS[verdict];
  const reviewer = asObject(output.reviewer);
  if (!style || !reviewer) return null;
  const title = getExpertDisplayTitle(
    { jobTitle: str(reviewer, "job_title"), role: str(reviewer, "role") },
    locale,
  );

  const quotes = Array.isArray(output.quotes)
    ? output.quotes
        .filter((q): q is string => typeof q === "string" && !!q.trim())
        .map(unescapePromptTags)
    : [];
  const escapedReason = str(output, "reason");
  const reason = escapedReason ? unescapePromptTags(escapedReason) : null;

  return (
    <div className={cn(CARD, "w-full rounded-3xl p-2.5")}>
      <div className="flex items-center gap-2.5">
        <ExpertAvatar
          name={title}
          avatarUrl={str(reviewer, "avatar_url") ?? null}
          size={28}
        />
        <div className="min-w-0 flex-1">
          <Text tone="emphasis" variant="body-medium" className="truncate">
            {title}
          </Text>
          <Text tone="muted" variant="small" className="truncate">
            {t("Checked this", "已检查此内容")}
          </Text>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5",
            style.chip,
          )}
        >
          <Icon icon={style.icon} size={14} />
          <Text variant="small-medium">
            {t(
              style.label,
              (
                {
                  pass: "无异议",
                  block: "已阻止",
                  insufficient: "未检查",
                } as Record<string, string>
              )[verdict],
            )}
          </Text>
        </span>
      </div>
      {reason ? (
        <div className="mt-2 px-0.5">
          <Text tone="secondary" variant="small">
            {reason}
          </Text>
        </div>
      ) : null}
      {quotes.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {quotes.map((quote, index) => (
            <li
              key={`${index}-${quote}`}
              className="border-l-2 border-border-base pl-2 text-foreground-tertiary"
            >
              <Text tone="muted" variant="small">
                {quote}
              </Text>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
