"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/DropdownMenu/DropdownMenu";
import type { IconSvgElement } from "@hugeicons/react";
import { useRef, type Ref } from "react";
import { cn } from "@/lib/utils";
import { MAX_ATTACHMENTS } from "../../../helpers/workspaceAttachments";
import { useComposerPlusMenu } from "./useComposerPlusMenu";
import {
  Attachment01Icon,
  BookOpen01Icon,
  Calendar03Icon,
  Camera01Icon,
  FolderOpenIcon,
  PlugSocketIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  triggerRef?: Ref<HTMLButtonElement>;
  onFilesSelected: (files: File[]) => void;
  onUseWorkspaceFile?: () => void;
  onClearGuidedPrompt?: () => void;
  disabled?: boolean;
  /** The message already holds `MAX_ATTACHMENTS` attachments: both file
   *  entries read disabled rather than letting the composer take another. */
  isAtCap?: boolean;
  className?: string;
  /** Composer settings that live behind the + rather than as icons in the
   *  tray (voice mode, model tier, the dev token readout). */
  extraItems?: ComposerMenuItem[];
}

export interface ComposerMenuItem {
  key: string;
  label: string;
  icon: IconSvgElement;
  onSelect: () => void;
  disabled?: boolean;
  opensPopover?: boolean;
}

export function ComposerPlusMenu({
  triggerRef,
  onFilesSelected,
  onUseWorkspaceFile,
  onClearGuidedPrompt,
  disabled,
  isAtCap = false,
  className,
  extraItems = [],
}: Props) {
  const { t } = useTranslation();
  const skipFocusRestore = useRef(false);
  const {
    fileInputRef,
    openModal,
    cameraInputRef,
    showWorkspaceOption,
    showCameraOption,
    openFilePicker,
    openCamera,
    handleFileChange,
    handlePhotoChange,
  } = useComposerPlusMenu({ onFilesSelected });

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        tabIndex={-1}
      />
      {/* Opens the rear camera on phones and tablets; the captured photo
          goes through the same path as any attached file. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoChange}
        tabIndex={-1}
        data-testid="composer-camera-input"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild ref={triggerRef}>
          <Button
            type="button"
            variant="tray"
            size="icon"
            aria-label={t("Add files and more", "添加文件及更多操作")}
            data-testid="composer-plus-button"
            disabled={disabled}
            className={cn(className)}
          >
            <Icon icon={PlusSignIcon} className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[14rem]"
          onCloseAutoFocus={(event) => {
            if (skipFocusRestore.current) event.preventDefault();
            skipFocusRestore.current = false;
          }}
        >
          <DropdownMenuItem
            disabled={isAtCap}
            onSelect={() => {
              onClearGuidedPrompt?.();
              openFilePicker();
            }}
          >
            <Icon icon={Attachment01Icon} className="mr-2 h-4 w-4" />
            {t("Attach file", "添加附件")}
            {isAtCap && <CapLabel />}
          </DropdownMenuItem>
          {showCameraOption && (
            <DropdownMenuItem
              disabled={isAtCap}
              onSelect={() => {
                onClearGuidedPrompt?.();
                openCamera();
              }}
            >
              <Icon icon={Camera01Icon} className="mr-2 h-4 w-4" />
              {t("Take photo", "拍照")}
              {isAtCap && <CapLabel />}
            </DropdownMenuItem>
          )}
          {showWorkspaceOption && (
            <DropdownMenuItem
              disabled={isAtCap}
              onSelect={() => {
                onClearGuidedPrompt?.();
                onUseWorkspaceFile?.();
              }}
            >
              <Icon icon={FolderOpenIcon} className="mr-2 h-4 w-4" />
              {t("Use File from Workspace", "使用工作区文件")}
              {isAtCap && <CapLabel />}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => {
              onClearGuidedPrompt?.();
              openModal("connect");
            }}
          >
            <Icon icon={PlugSocketIcon} className="mr-2 h-4 w-4" />
            {t("Connect service", "连接服务")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openModal("skills")}>
            <Icon icon={BookOpen01Icon} className="mr-2 h-4 w-4" />
            {t("Skills", "技能")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openModal("scheduled")}>
            <Icon icon={Calendar03Icon} className="mr-2 h-4 w-4" />
            {t("Scheduled", "定时任务")}
          </DropdownMenuItem>
          {extraItems.length > 0 && <DropdownMenuSeparator />}
          {extraItems.map((item) => (
            <DropdownMenuItem
              key={item.key}
              disabled={item.disabled}
              onSelect={() => {
                skipFocusRestore.current = !!item.opensPopover;
                item.onSelect();
              }}
            >
              <Icon icon={item.icon} className="mr-2 h-4 w-4" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function CapLabel() {
  const { t } = useTranslation();
  return (
    <span className="ml-auto pl-3 text-caption text-foreground-tertiary">
      {t(MAX_ATTACHMENTS + " max", "最多 " + MAX_ATTACHMENTS + " 个")}
    </span>
  );
}
