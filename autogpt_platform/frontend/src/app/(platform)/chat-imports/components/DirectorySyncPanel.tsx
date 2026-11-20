import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/atoms/Card/Card";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { useRef, type ChangeEvent } from "react";
import { useDirectorySync } from "../useDirectorySync";
import { readLocalSelection } from "../useImportAttachments";
import { DirectorySyncStatus } from "./DirectorySyncStatus";

type PickerProps = {
  busy: boolean;
  label: string;
  hint: string;
  inputLabel: string;
  onPick: (files: File[]) => void;
};

function DirectoryPicker({
  busy,
  label,
  hint,
  inputLabel,
  onPick,
}: PickerProps) {
  const input = useRef<HTMLInputElement>(null);

  function chooseFolder() {
    const field = input.current;
    if (!field || busy) return;
    field.setAttribute("webkitdirectory", "");
    field.click();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onPick(readLocalSelection(event));
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        aria-label={inputLabel}
        disabled={busy}
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="secondary"
        size="small"
        leadingIcon={FolderOpenIcon}
        disabled={busy}
        onClick={chooseFolder}
      >
        {label}
      </Button>
      <Text variant="small" tone="secondary" className="break-words">
        {hint}
      </Text>
    </div>
  );
}

export function DirectorySyncPanel({ ownerID }: { ownerID: string }) {
  const { t } = useTranslation();
  const sync = useDirectorySync(ownerID);
  return (
    <Card variant="outlined" className="min-w-0">
      <section
        className="space-y-4 p-4 sm:p-6"
        aria-labelledby="directory-sync-heading"
      >
        <div className="space-y-1">
          <Text as="h2" variant="h4" id="directory-sync-heading">
            {t("Sync a conversation folder", "批量同步到最近会话")}
          </Text>
          <Text variant="body" tone="secondary">
            {t(
              "Choose a history folder to sync its conversations to Recent chats. Only titles and message text are sent—not original files, attachments, or tool logs.",
              "选中会话目录后自动同步，无需逐条勾选。只发送会话标题和问答文本，不上传原文件、附件或工具日志。",
            )}
          </Text>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <DirectoryPicker
            busy={sync.busy}
            label={t(
              "Choose WorkBuddy history folder",
              "选择 WorkBuddy 会话目录",
            )}
            inputLabel={t("WorkBuddy sync directory", "WorkBuddy 批量同步目录")}
            hint={t(
              "On Windows, select %USERPROFILE%\\.workbuddy\\projects.",
              "Windows：选择 %USERPROFILE%\\.workbuddy\\projects。",
            )}
            onPick={(files) => void sync.start("workbuddy", files)}
          />
          <DirectoryPicker
            busy={sync.busy}
            label={t("Choose QwenWork history folder", "选择千问办公会话目录")}
            inputLabel={t("QwenWork sync directory", "千问办公批量同步目录")}
            hint={t(
              "Quit QwenWork, then select %APPDATA%\\QwenWorkCN\\data on Windows.",
              "先退出千问办公，再选择 %APPDATA%\\QwenWorkCN\\data。",
            )}
            onPick={(files) => void sync.start("qwenwork", files)}
          />
        </div>
        {sync.state && <DirectorySyncStatus state={sync.state} />}
      </section>
    </Card>
  );
}
