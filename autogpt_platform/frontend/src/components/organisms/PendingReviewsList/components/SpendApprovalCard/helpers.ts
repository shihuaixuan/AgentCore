import type { PendingHumanReviewModel } from "@/app/api/__generated__/models/pendingHumanReviewModel";
import type { Locale } from "@/lib/i18n/locale";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import {
  getChargedExpertID,
  getReviewExpert,
  type ExpertRoster,
} from "../../expertIdentity";

export type SpendSummary = NonNullable<ReturnType<typeof spendSummary>>;

// Reads the payload `spend_approval.py::_review_payload` writes. Every review
// in a group is the same expert in the same window; runs parked later saw a
// higher spend, so the largest is the current one.
export function spendSummary(
  reviews: PendingHumanReviewModel[],
  locale: Locale,
  roster?: ExpertRoster,
) {
  const first = reviews[0];
  if (!first) return null;
  const payload = asRecord(first.payload);
  const threshold = payload.threshold_credits;
  const spent = Math.max(...reviews.map(spentCredits));
  if (typeof threshold !== "number" || !Number.isFinite(spent)) return null;
  const { title, avatarURL } = getReviewExpert(first, locale, roster);

  return {
    expertTitle: title ?? getExpertDisplayTitle(null, locale),
    avatarURL,
    spent,
    threshold,
    period: payload.window === "week" ? "this week" : "today",
    waiting: reviews.length,
  };
}

export function getSpendReviewTitle(
  review: PendingHumanReviewModel,
  expertTitle: string | null,
) {
  if (!expertTitle || !getChargedExpertID(review)) return null;
  const { expert, spent_credits, threshold_credits, window } = asRecord(
    review.payload,
  );
  if (
    typeof expert !== "string" ||
    typeof spent_credits !== "number" ||
    typeof threshold_credits !== "number"
  )
    return null;

  const period = window === "week" ? "this week" : "today";
  const details = `has used ${spent_credits} of ${threshold_credits} credits ${period} and needs your approval to keep spending`;
  return review.instructions === `${expert} ${details}`
    ? `${expertTitle} ${details}`
    : null;
}

export function spendSubtitle(summary: SpendSummary) {
  const past = `That's past your ${summary.threshold} check-in.`;
  if (summary.waiting === 1) return `${past} Keep going?`;
  return `${past} ${summary.waiting} tasks are ready to go.`;
}

function spentCredits(review: PendingHumanReviewModel) {
  const spent = asRecord(review.payload).spent_credits;
  return typeof spent === "number" ? spent : Number.NaN;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
