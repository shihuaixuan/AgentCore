import type { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { HomeAttentionItem } from "@/app/api/__generated__/models/homeAttentionItem";
import {
  type ApprovalItem,
  isBare,
  isGateReview,
  isHeldRead,
} from "@/app/(platform)/copilot/components/ApprovalQueue/helpers";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import type { AttentionListRow } from "./useHeldReview";

// A passage this short is shown whole on the row, so it can be released from there.
export const PASSAGE_FITS = 180;

// A held AutoPilot call the gate wrote a headline for; older rows keep the generic row.
export function isHeldCall(item: HomeAttentionItem) {
  return (
    item.kind === "approval" &&
    !!item.review &&
    isGateReview(item.review) &&
    !!item.headline
  );
}

// The row shows everything the card would, so it may be approved without opening it.
export function isInformed(item: ApprovalItem) {
  if (item.spend || item.subject.irreversible) return false;
  if (isHeldRead(item))
    return item.unjudged || (item.passage ?? "").length <= PASSAGE_FITS;
  return isBare(item);
}

export function receiptText(
  item: ApprovalItem,
  approved: boolean,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
) {
  if (isHeldRead(item))
    return approved
      ? t(
          `Released · ${item.reader} is reading it`,
          `已放行 · ${item.reader} 正在阅读`,
        )
      : t(
          `Kept out · ${item.reader} was told`,
          `已拦截 · 已告知 ${item.reader}`,
        );
  return approved
    ? t(
        `Approved · ${AUTOPILOT_NAME} is on it`,
        `已批准 · ${AUTOPILOT_NAME} 正在处理`,
      )
    : t(
        `Rejected · ${AUTOPILOT_NAME} was told`,
        `已拒绝 · 已告知 ${AUTOPILOT_NAME}`,
      );
}

// "3h", "40m": narrow enough for a column of twenty rows.
export function shortAge(
  createdAt: Date | string,
  now = new Date(),
  locale?: string,
) {
  const minutes = Math.max(
    1,
    Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60_000),
  );
  const [value, unit] =
    minutes < 60
      ? [minutes, "minute"]
      : minutes < 24 * 60
        ? [Math.floor(minutes / 60), "hour"]
        : [Math.floor(minutes / (24 * 60)), "day"];
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "narrow",
  }).format(value);
}

export function headlineButtonId(itemID: string) {
  return `held-${itemID.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

// "4 released · 1 kept out · 1 answered elsewhere"
export function reviewTally(
  rows: AttentionListRow[],
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
) {
  const counts = new Map<string, number>();
  for (const { receipt } of rows) {
    if (!receipt) continue;
    const label = receipt.text.split(" · ")[0].toLowerCase();
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const labels: Record<string, string> = {
    released: t("released", "已放行"),
    "kept out": t("kept out", "已拦截"),
    approved: t("approved", "已批准"),
    rejected: t("rejected", "已拒绝"),
    "answered elsewhere": t("answered elsewhere", "已在别处处理"),
  };
  return [...counts]
    .map(([label, n]) => `${n} ${labels[label] ?? label}`)
    .join(" · ");
}
