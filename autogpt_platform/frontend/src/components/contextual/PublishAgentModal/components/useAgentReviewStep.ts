"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { SubmissionStatus } from "@/app/api/__generated__/models/submissionStatus";
import { getSubmissionMeta } from "../helpers";
import {
  Cancel01Icon,
  NoteEditIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

interface HeroContent {
  title: string;
  description: string;
  Icon: IconSvgElement;
  pulse: string;
  gradient: string;
}

function getHeroContent(
  status: SubmissionStatus | undefined,
  isDashboardPage: boolean,
  t: ReturnType<typeof useTranslation>["t"],
): HeroContent {
  switch (status) {
    case SubmissionStatus.APPROVED:
      return {
        title: t("Workflow approved", "工作流已获批准"),
        description: t(
          "Your workflow has been approved and is now live on the AutoGPT marketplace.",
          "您的工作流已获批准，并已在 AutoGPT 市场上线。",
        ),
        Icon: Tick02Icon,
        pulse: "bg-success/40",
        gradient: "from-success/70 to-success",
      };
    case SubmissionStatus.REJECTED:
      return {
        title: t("Workflow needs changes", "工作流需要修改"),
        description: t(
          "Your submission was not approved. Review the feedback and resubmit.",
          "您的提交未获批准。请查看反馈后重新提交。",
        ),
        Icon: Cancel01Icon,
        pulse: "bg-error/40",
        gradient: "from-error/70 to-error-hover",
      };
    case SubmissionStatus.DRAFT:
      return {
        title: t("Draft saved", "草稿已保存"),
        description: t(
          "This workflow isn't submitted yet. Finish the details and submit it for review.",
          "此工作流尚未提交。请完善详情并提交审核。",
        ),
        Icon: NoteEditIcon,
        pulse: "bg-foreground-subtle/40",
        gradient: "from-foreground-subtle to-foreground-secondary",
      };
    default:
      return {
        title: t("Submission received", "已收到提交"),
        description: isDashboardPage
          ? t(
              "We'll notify you once review is complete. Approved workflows go live on the marketplace.",
              "审核完成后会通知您。获批的工作流将在市场上线。",
            )
          : t(
              "We'll notify you once review is complete. Track progress from the Creator Dashboard.",
              "审核完成后会通知您。您可以在创作者控制台中查看进度。",
            ),
        Icon: Tick02Icon,
        pulse: "bg-brand/40",
        gradient: "from-brand/80 to-brand-hover",
      };
  }
}

interface Args {
  status: SubmissionStatus | undefined;
  version: number | undefined;
  category: string | null | undefined;
  submittedAt: string | Date | null | undefined;
  reviewedAt: string | Date | null | undefined;
  runCount: number | undefined;
}

export function useAgentReviewStep({
  status,
  version,
  category,
  submittedAt,
  reviewedAt,
  runCount,
}: Args) {
  const pathname = usePathname();
  const isDashboardPage = pathname.includes("/settings/creator-dashboard");
  const { t, locale } = useTranslation();
  const hero = getHeroContent(status, isDashboardPage, t);
  const shouldReduceMotion = useReducedMotion();

  const isApproved = status === SubmissionStatus.APPROVED;
  const isRejected = status === SubmissionStatus.REJECTED;
  const isDraft = status === SubmissionStatus.DRAFT;
  const isPending = !isApproved && !isRejected && !isDraft;

  const showCelebration = isApproved || (isPending && !isDashboardPage);
  const showConfetti = showCelebration && !shouldReduceMotion;

  const metaItems = getSubmissionMeta(
    {
      status,
      version,
      category,
      submittedAt,
      reviewedAt,
      runCount,
    },
    t,
    locale,
  );

  return {
    isDashboardPage,
    hero,
    shouldReduceMotion,
    isApproved,
    isRejected,
    isDraft,
    isPending,
    showCelebration,
    showConfetti,
    metaItems,
  };
}
