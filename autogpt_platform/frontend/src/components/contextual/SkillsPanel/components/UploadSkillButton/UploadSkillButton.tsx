"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { useUploadSkillButton } from "./useUploadSkillButton";
import { Upload03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  onUploaded?: (name: string) => void;
}

export function UploadSkillButton({ onUploaded }: Props) {
  const { t } = useTranslation();

  const { fileInputRef, isUploading, openFilePicker, handleFileChange } =
    useUploadSkillButton({ onUploaded });

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown,.zip,application/zip"
        className="hidden"
        onChange={handleFileChange}
        data-testid="skill-upload-input"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="small"
            onClick={openFilePicker}
            loading={isUploading}
            data-testid="skill-upload-button"
          >
            <Icon icon={Upload03Icon} className="mr-1 h-4 w-4" />
            {t("Upload skill", "上传技能")}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t(
            "Import a SKILL.md, or a zipped skill package",
            "导入 SKILL.md 文件或 ZIP 格式的技能包",
          )}
        </TooltipContent>
      </Tooltip>
    </>
  );
}
