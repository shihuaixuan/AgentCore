"use client";

import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { Input } from "@/components/atoms/Input/Input";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  isOpen: boolean;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
}

export function FeedbackModal({ isOpen, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");

  function handleSubmit() {
    if (!comment.trim()) return;
    onSubmit(comment);
    setComment("");
  }

  function handleClose() {
    onCancel();
    setComment("");
  }

  return (
    <Dialog
      title={t("What could have been better?", "哪些地方可以做得更好？")}
      controlled={{
        isOpen,
        set: (open) => {
          if (!open) handleClose();
        },
      }}
    >
      <Dialog.Content>
        <div className="mx-auto w-[95%] space-y-4">
          <Text variant="body-tight" as="p" tone="muted">
            {t(
              "Your feedback helps us improve. Share details below.",
              "你的反馈有助于我们改进。请在下方分享详情。",
            )}
          </Text>
          <Input
            bare
            type="textarea"
            placeholder={t(
              "Tell us what went wrong or could be improved...",
              "请告诉我们哪里出了问题，或有哪些可以改进的地方…",
            )}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <Text variant="small-tight" as="p" tone="muted">
              {comment.length}/2000
            </Text>
            <div className="flex gap-2">
              <Button variant="outline" size="small" onClick={handleClose}>
                {t("Cancel", "取消")}
              </Button>
              <Button
                size="small"
                onClick={handleSubmit}
                disabled={!comment.trim()}
              >
                {t("Submit feedback", "提交反馈")}
              </Button>
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
