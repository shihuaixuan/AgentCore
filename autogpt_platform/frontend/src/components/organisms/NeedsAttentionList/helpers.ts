import type { PendingHumanReviewModel } from "@/app/api/__generated__/models/pendingHumanReviewModel";
import type { Locale } from "@/lib/i18n/locale";

export function getReviewTitle(
  review: PendingHumanReviewModel,
  locale: Locale = "en",
): string {
  return (
    review.instructions ||
    review.agent_name ||
    (locale === "zh-CN" ? "需要审核" : "Review needed")
  );
}
