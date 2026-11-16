"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getListCopilotSkillsQueryKey,
  useUploadCopilotSkill,
  useUploadCopilotSkillPackage,
} from "@/app/api/__generated__/endpoints/skills/skills";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { getSkillUploadError, isSkillPackageFile } from "./helpers";

interface Args {
  onUploaded?: (name: string) => void;
}

export function useUploadSkillButton({ onUploaded }: Args = {}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: uploadSkill, isPending: isUploadingFile } =
    useUploadCopilotSkill();
  const { mutateAsync: uploadPackage, isPending: isUploadingPackage } =
    useUploadCopilotSkillPackage();
  const isUploading = isUploadingFile || isUploadingPackage;

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset the input so re-picking the same file fires onChange again.
    event.target.value = "";
    if (!file) return;

    try {
      const result = isSkillPackageFile(file)
        ? await uploadPackage({ data: { file } })
        : await uploadMarkdownSkill(file);
      if (!result) return;

      const name =
        result.status === 201 ? result.data.name : (file.name ?? "skill");
      toast({ title: t(`Skill "${name}" uploaded`, `技能“${name}”已上传`) });
      if (result.status === 201) {
        onUploaded?.(result.data.name);
      }
      queryClient.invalidateQueries({
        queryKey: getListCopilotSkillsQueryKey(),
      });
    } catch (error) {
      toast({
        title: t("Failed to upload skill", "上传技能失败"),
        description:
          error instanceof Error
            ? error.message
            : t("An unexpected error occurred.", "发生意外错误。"),
        variant: "destructive",
      });
    }
  }

  // `null` when the client-side pre-flight rejected the file and has already
  // said so, so the caller reports nothing further.
  async function uploadMarkdownSkill(file: File) {
    const content = await file.text();

    // Pre-flight the common rejections client-side so the user gets an
    // instant, specific message instead of waiting on a server round-trip.
    const validationError = getSkillUploadError(content, t);
    if (validationError) {
      toast({
        title: t("Can't upload this skill", "无法上传此技能"),
        description: validationError,
        variant: "destructive",
      });
      return null;
    }
    return uploadSkill({ data: { content } });
  }

  return {
    fileInputRef,
    isUploading,
    openFilePicker,
    handleFileChange,
  };
}
