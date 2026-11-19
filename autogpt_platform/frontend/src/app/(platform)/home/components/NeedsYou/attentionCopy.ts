import { approvalHeadline } from "@/app/(platform)/copilot/components/ApprovalQueue/approval-copy";
import {
  type ApprovalItem,
  isHeldRead,
  toApprovalItem,
} from "@/app/(platform)/copilot/components/ApprovalQueue/helpers";
import type { HomeAttentionItem } from "@/app/api/__generated__/models/homeAttentionItem";
import type { PendingHumanReviewModel } from "@/app/api/__generated__/models/pendingHumanReviewModel";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import type { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

type Translate = ReturnType<typeof useTranslation>["t"];

export function getAttentionTitle(
  item: HomeAttentionItem,
  expertTitle: string | null,
  t: Translate,
) {
  if (!item.expert || !expertTitle) return item.title;
  const { name } = item.expert;
  switch (item.kind) {
    case "setup":
      if (item.title === `Finish setting up ${name}`) {
        return t(
          `Finish setting up ${expertTitle}`,
          `完成 ${expertTitle} 的设置`,
        );
      }
      break;
    case "paused":
      if (item.title === `Review ${name}'s paused work`) {
        return t(
          `Review ${expertTitle}'s paused work`,
          `查看 ${expertTitle} 已暂停的工作`,
        );
      }
      break;
    case "question":
      if (item.title === `${name} has a question`) {
        return t(`${expertTitle} has a question`, `${expertTitle} 有一个问题`);
      }
      break;
  }
  return item.title;
}

export function getAttentionDescription(
  item: HomeAttentionItem,
  expertTitle: string | null,
  t: Translate,
) {
  if (expertTitle && item.review?.session_id) {
    const names = [item.review.expert_name, item.expert?.name];
    if (
      names.some(
        (name) =>
          name && item.description === `${name} is waiting for your approval.`,
      )
    ) {
      return t(
        `${expertTitle} is waiting for your approval.`,
        `${expertTitle} 正在等待你的批准。`,
      );
    }
  }
  return item.description;
}

export function toHomeApprovalItem(
  review: PendingHumanReviewModel,
  expert: HomeAttentionItem["expert"],
  locale: Locale,
) {
  const approval = toApprovalItem(review);
  if (!isHeldRead(approval) || approval.reader === AUTOPILOT_NAME) {
    return approval;
  }

  const reader = getExpertDisplayTitle(
    expert?.name === approval.reader || review.expert_name === approval.reader
      ? expert
      : null,
    locale,
  );
  const { ask } = approval.headline;
  const oldPrefix = `Let ${approval.reader} read`;
  const displayAsk =
    ask === oldPrefix || ask.startsWith(`${oldPrefix} what `)
      ? `Let ${reader} read${ask.slice(oldPrefix.length)}`
      : ask;
  return {
    ...approval,
    reader,
    headline: { ...approval.headline, ask: displayAsk },
  };
}

export function getHeldCallTitle(
  item: HomeAttentionItem,
  approval: ApprovalItem,
  locale: Locale,
) {
  if (!isHeldRead(approval)) return item.title;
  const { ask, object } = approval.headline;
  const action = approvalHeadline(ask, approval.toolName, locale);
  return object ? `${action} “${object}”` : action;
}
