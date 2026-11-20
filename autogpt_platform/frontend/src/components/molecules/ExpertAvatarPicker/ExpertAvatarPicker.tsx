"use client";

import type { ExpertAvatarRequestCategory } from "@/app/api/__generated__/models/expertAvatarRequestCategory";
import { Button } from "@/components/atoms/Button/Button";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { ExpertAvatar } from "../ExpertAvatar/ExpertAvatar";
import { ACCEPTED_AVATAR_TYPES } from "./helpers";
import { useExpertAvatarPicker } from "./useExpertAvatarPicker";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useEffect } from "react";

interface Props {
  name: string;
  category: ExpertAvatarRequestCategory;
  avatarUrl?: string | null;
  onPick: (url: string) => void;
  onPreviewChange?: (url: string | null) => void;
}

export function ExpertAvatarPicker({ name, onPreviewChange, ...props }: Props) {
  const { t } = useTranslation();
  const picker = useExpertAvatarPicker({ name, ...props });
  useEffect(() => {
    onPreviewChange?.(picker.selectedUrl);
    return () => onPreviewChange?.(null);
  }, [onPreviewChange, picker.selectedUrl]);
  return (
    <div
      data-slot="expert-avatar-picker"
      className="flex w-full flex-col items-center gap-4 rounded-2xl border border-border-base bg-canvas p-5"
    >
      <ExpertAvatar
        name={name || t("Your expert", "你的专家")}
        imageLabel={name || t("Your expert", "你的专家")}
        avatarUrl={picker.selectedUrl}
        size={144}
        className={picker.isGenerating ? "animate-pulse" : undefined}
      />
      {picker.isGenerating && (
        <p
          role="status"
          data-slot="expert-avatar-picker-status"
          className="text-body leading-5 text-foreground-tertiary"
        >
          {t(
            "Creating another avatar. You can keep this one or upload a picture while you wait.",
            "正在生成另一个头像。等待期间，你可以保留当前头像或上传图片。",
          )}
        </p>
      )}
      {picker.error && (
        <p
          role="alert"
          data-slot="expert-avatar-picker-error"
          className="text-body leading-5 text-error"
        >
          {picker.error}
        </p>
      )}
      <input
        ref={picker.fileInputRef}
        type="file"
        disabled={picker.isUploading}
        accept={ACCEPTED_AVATAR_TYPES}
        aria-label={t("Upload avatar", "上传头像")}
        data-slot="expert-avatar-picker-file-input"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void picker.uploadFile(file);
        }}
      />
      <div
        data-slot="expert-avatar-picker-actions"
        className="flex w-full flex-wrap justify-end gap-2"
      >
        <Button
          variant="ghost"
          size="small"
          onClick={picker.openFilePicker}
          disabled={picker.isUploading}
          data-slot="expert-avatar-picker-upload"
        >
          {t("Upload a picture", "上传图片")}
        </Button>
        <Button
          variant="secondary"
          size="small"
          leadingIcon={RefreshIcon}
          onClick={picker.generate}
          loading={picker.isGenerating}
          disabled={picker.isBusy}
          data-slot="expert-avatar-picker-regenerate"
        >
          {t("Regenerate", "重新生成")}
        </Button>
        <Button
          size="small"
          onClick={picker.confirm}
          disabled={picker.isUploading}
          data-slot="expert-avatar-picker-confirm"
        >
          {t("Use this avatar", "使用此头像")}
        </Button>
      </div>
    </div>
  );
}
