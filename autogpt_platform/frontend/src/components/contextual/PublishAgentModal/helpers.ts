import { SubmissionStatus } from "@/app/api/__generated__/models/submissionStatus";

export const emptyModalState = {
  agent_id: "",
  title: "",
  subheader: "",
  slug: "",
  thumbnailSrc: "",
  youtubeLink: "",
  category: "",
  description: "",
  recommendedScheduleCron: "",
  instructions: "",
  agentOutputDemo: "",
  changesSummary: "",
  additionalImages: [],
};

export interface SubmissionMetaItem {
  label: string;
  value: string;
  title?: string;
}

export function formatSubmissionDate(
  value: string | Date | null | undefined,
): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const DAY_MS = 86_400_000;

export function formatRelativeDate(
  value: string | Date | null | undefined,
  t: (english: string, chinese: string) => string = (english) => english,
): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const days = Math.floor((Date.now() - date.getTime()) / DAY_MS);
  if (days <= 0) return t("today", "今天");
  if (days === 1) return t("yesterday", "昨天");
  if (days < 7) return t(`${days} days ago`, `${days} 天前`);
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return t(`${weeks} week${weeks > 1 ? "s" : ""} ago`, `${weeks} 周前`);
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return t(`${months} month${months > 1 ? "s" : ""} ago`, `${months} 个月前`);
  }
  const years = Math.floor(days / 365);
  return t(`${years} year${years > 1 ? "s" : ""} ago`, `${years} 年前`);
}

function dateItem(
  label: string,
  value: string | Date | null | undefined,
  t: (english: string, chinese: string) => string,
): SubmissionMetaItem | null {
  const relative = formatRelativeDate(value, t);
  if (!relative) return null;
  return {
    label,
    value: relative,
    title: formatSubmissionDate(value) ?? undefined,
  };
}

interface SubmissionMetaArgs {
  status: SubmissionStatus | undefined;
  version: number | undefined;
  category: string | null | undefined;
  submittedAt: string | Date | null | undefined;
  reviewedAt: string | Date | null | undefined;
  runCount: number | undefined;
}

export function getSubmissionMeta(
  {
    status,
    version,
    category,
    submittedAt,
    reviewedAt,
    runCount,
  }: SubmissionMetaArgs,
  t: (english: string, chinese: string) => string = (english) => english,
): SubmissionMetaItem[] {
  const items: SubmissionMetaItem[] = [];

  if (typeof version === "number") {
    items.push({ label: t("Version", "版本"), value: `v${version}` });
  }
  if (category) {
    items.push({ label: t("Category", "分类"), value: category });
  }

  if (status === SubmissionStatus.APPROVED) {
    const liveSince = dateItem(t("Live since", "上线时间"), reviewedAt, t);
    if (liveSince) items.push(liveSince);
    if (typeof runCount === "number") {
      items.push({
        label: t("Runs", "运行次数"),
        value: runCount.toLocaleString(),
      });
    }
  } else if (status === SubmissionStatus.REJECTED) {
    const reviewed = dateItem(t("Reviewed", "审核时间"), reviewedAt, t);
    if (reviewed) items.push(reviewed);
  } else if (status === SubmissionStatus.DRAFT) {
    items.push({
      label: t("Status", "状态"),
      value: t("Not submitted yet", "尚未提交"),
    });
  } else {
    const submitted = dateItem(t("Submitted", "提交时间"), submittedAt, t);
    if (submitted) items.push(submitted);
  }

  return items;
}
