import { Button } from "@/components/atoms/Button/Button";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useId, useRef } from "react";
import {
  fitsAttachmentLimits,
  readLocalSelection,
} from "../useWorkBuddyAttachments";

export function AttachmentFolder({
  sourceRoot,
  folder,
  mapped,
  disabled,
  onRoot,
  onFolder,
  onConfirm,
}: {
  sourceRoot: string;
  folder?: string;
  mapped: boolean;
  disabled: boolean;
  onRoot: (root: string) => void;
  onFolder: (files: File[]) => void;
  onConfirm: (confirmed: boolean) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const picker = useRef<HTMLInputElement>(null);
  function chooseFolder() {
    if (!picker.current) return;
    picker.current.setAttribute("webkitdirectory", "");
    picker.current.click();
  }
  return (
    <div className="space-y-2 rounded-lg border border-border-base p-3">
      <Text as="h3" variant="body-medium">
        {t("Match local attachments", "匹配本地附件")}
      </Text>
      <Text variant="small" tone="secondary">
        {t(
          "Optional. Choose the same project folder as the original path below. Only checked files will be uploaded.",
          "可选。请选择与下方原路径对应的项目目录；只上传已勾选的文件。",
        )}
      </Text>
      <Input
        id={id}
        label={t("Original folder path", "原目录路径")}
        size="small"
        value={sourceRoot}
        autoComplete="off"
        spellCheck={false}
        maxLength={1024}
        disabled={disabled}
        onChange={(event) => onRoot(event.currentTarget.value)}
      />
      <input
        ref={picker}
        type="file"
        multiple
        className="hidden"
        aria-label={t("Choose attachment folder", "选择附件目录")}
        disabled={disabled}
        onChange={(event) => {
          const files = readLocalSelection(event);
          if (files.length) onFolder(files);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="small"
          variant="secondary"
          onClick={chooseFolder}
          disabled={disabled}
        >
          {t(
            folder ? "Change folder" : "Choose attachment folder",
            folder ? "更换目录" : "选择附件目录",
          )}
        </Button>
        {folder && (
          <>
            <Text as="span" variant="small" className="break-all" dir="auto">
              {folder}
            </Text>
            <Button
              type="button"
              size="small"
              variant="ghost"
              disabled={disabled}
              onClick={() => onFolder([])}
            >
              {t("Clear folder", "清除目录")}
            </Button>
          </>
        )}
      </div>
      {folder && (
        <label className="flex items-start gap-2">
          <Checkbox
            checked={mapped}
            disabled={disabled || !sourceRoot.trim()}
            onCheckedChange={(value) => onConfirm(value === true)}
          />
          <Text as="span" variant="small">
            {t(
              "Use this folder for the original path",
              "将所选目录对应到此原路径",
            )}
          </Text>
        </label>
      )}
    </div>
  );
}

export function AttachmentChoices({
  files,
  unmatched,
  selected,
  disabled,
  onPick,
  onToggle,
}: {
  files: File[];
  unmatched: string[];
  selected: File[];
  disabled: boolean;
  onPick: (files: File[]) => void;
  onToggle: (file: File, include: boolean) => void;
}) {
  const { t } = useTranslation();
  const picker = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2 border-t border-border-base pt-3">
      <Text as="h4" variant="body-medium">
        {t("Attachments", "附件")}
      </Text>
      <Text variant="small" tone="secondary">
        {t(
          "Check the files to save with this conversation. Up to 10 files, 5 MiB each and 10 MiB total.",
          "勾选要随此会话保存的附件。最多 10 个，单个不超过 5 MiB，合计不超过 10 MiB。",
        )}
      </Text>
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <AttachmentChoice
              key={index}
              file={file}
              checked={selected.includes(file)}
              disabled={disabled}
              fits={fitsAttachmentLimits([...selected, file])}
              onToggle={(include) => onToggle(file, include)}
            />
          ))}
        </ul>
      )}
      {unmatched.length > 0 && (
        <details>
          <summary className="cursor-pointer">
            <Text as="span" variant="small">
              {t(
                `${unmatched.length} unmatched references`,
                `${unmatched.length} 个未匹配引用`,
              )}
            </Text>
          </summary>
          <ul className="max-h-32 overflow-auto">
            {unmatched.map((path) => (
              <li key={path}>
                <Text
                  variant="small"
                  tone="secondary"
                  className="break-all"
                  dir="auto"
                >
                  {path}
                </Text>
              </li>
            ))}
          </ul>
        </details>
      )}
      <input
        ref={picker}
        type="file"
        multiple
        className="hidden"
        aria-label={t("Choose individual attachments", "选择单个附件")}
        disabled={disabled}
        onChange={(event) => onPick(readLocalSelection(event))}
      />
      <Button
        type="button"
        size="small"
        variant="secondary"
        disabled={disabled}
        onClick={() => picker.current?.click()}
      >
        {t("Choose files manually", "手动选取附件")}
      </Button>
    </div>
  );
}

function AttachmentChoice({
  file,
  checked,
  fits,
  disabled,
  onToggle,
}: {
  file: File;
  checked: boolean;
  fits: boolean;
  disabled: boolean;
  onToggle: (include: boolean) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const tooLarge = !checked && !fits;
  return (
    <li className="flex items-start gap-2">
      <Checkbox
        checked={checked}
        disabled={disabled || tooLarge}
        aria-labelledby={`${id}-include ${id}-name`}
        onCheckedChange={(value) => onToggle(value === true)}
      />
      <div className="min-w-0">
        <Text
          as="span"
          id={`${id}-include`}
          variant="small"
          className="sr-only"
        >
          {t("Include", "包含")}
        </Text>
        <Text
          id={`${id}-name`}
          variant="small"
          className="break-all"
          dir="auto"
        >
          {file.name}
        </Text>
        <Text variant="small" tone="secondary" className="break-all" dir="auto">
          {file.webkitRelativePath ? `${file.webkitRelativePath} · ` : ""}
          {t(
            `${file.size.toLocaleString()} bytes`,
            `${file.size.toLocaleString()} 字节`,
          )}
          {tooLarge &&
            t(
              " · exceeds selection limits or is empty",
              " · 超出选择限制或为空文件",
            )}
        </Text>
      </div>
    </li>
  );
}
