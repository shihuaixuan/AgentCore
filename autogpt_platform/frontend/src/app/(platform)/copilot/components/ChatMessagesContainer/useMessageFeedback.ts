import { usePostV2SubmitMessageFeedback } from "@/app/api/__generated__/endpoints/chat/chat";
import type { MessageFeedbackRequest } from "@/app/api/__generated__/models/messageFeedbackRequest";
import { toast } from "@/components/molecules/Toast/use-toast";
import { copyTextToClipboard } from "@/lib/clipboard";
import * as Sentry from "@sentry/nextjs";
import type { UIDataTypes, UIMessage, UITools } from "ai";
import { useState } from "react";
import { getRatedMessageId } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type Rating = "upvote" | "downvote";

interface Args {
  sessionID: string | null;
  message: UIMessage<unknown, UIDataTypes, UITools>;
  savedMessageId?: string | null;
}

export function useMessageFeedback({
  sessionID,
  message,
  savedMessageId,
}: Args) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<Rating | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { mutateAsync: submitFeedback } = usePostV2SubmitMessageFeedback();

  const ratedMessageId = getRatedMessageId(message, savedMessageId);
  const canRate = sessionID !== null && ratedMessageId !== null;

  async function sendScore(score: Omit<MessageFeedbackRequest, "message_id">) {
    if (!sessionID || !ratedMessageId) return false;
    try {
      await submitFeedback({
        sessionId: sessionID,
        data: { message_id: ratedMessageId, ...score },
      });
      return true;
    } catch (error) {
      Sentry.captureException(error);
      return false;
    }
  }

  async function saveRating(rating: Rating, comment?: string) {
    const saved = await sendScore({
      score_name: "user-feedback",
      score_value: rating === "upvote" ? 1 : 0,
      comment,
    });
    if (!saved) {
      setFeedback(null);
      toast({
        title: t("Couldn't save your feedback", "无法保存你的反馈"),
        description: t("Please try again.", "请重试。"),
        variant: "destructive",
      });
      return;
    }
    toast({
      title: t("Thank you for your feedback!", "感谢你的反馈！"),
      variant: "success",
      duration: 3000,
    });
  }

  async function handleCopy(text: string) {
    if (!(await copyTextToClipboard(text))) {
      toast({
        title: t("Failed to copy", "复制失败"),
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    toast({
      title: t("Copied!", "已复制！"),
      variant: "success",
      duration: 2000,
    });
    // A signal for us, not an action the user asked for: the copy itself
    // succeeded, so a failure to record it is reported but not shown.
    if (canRate) void sendScore({ score_name: "copy", score_value: 1 });
  }

  function explainNotRateableYet() {
    toast({
      title: t("Can't rate this reply yet", "暂时无法评价此回复"),
      description: t(
        "It may still be saving. Try again in a moment, or refresh the page.",
        "回复可能仍在保存。请稍后重试或刷新页面。",
      ),
      duration: 3000,
    });
  }

  function handleUpvote() {
    if (feedback) return;
    if (!canRate) return explainNotRateableYet();
    setFeedback("upvote");
    void saveRating("upvote");
  }

  function handleDownvoteClick() {
    if (feedback) return;
    if (!canRate) return explainNotRateableYet();
    setFeedback("downvote");
    setShowFeedbackModal(true);
  }

  function handleDownvoteSubmit(comment: string) {
    setShowFeedbackModal(false);
    void saveRating("downvote", comment || undefined);
  }

  function handleDownvoteCancel() {
    setShowFeedbackModal(false);
    setFeedback(null);
  }

  return {
    feedback,
    canRate,
    showFeedbackModal,
    handleCopy,
    handleUpvote,
    handleDownvoteClick,
    handleDownvoteSubmit,
    handleDownvoteCancel,
  };
}
