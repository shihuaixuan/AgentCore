import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { useRef, type ChangeEvent } from "react";
import { checkQwenWorkAttachmentFiles } from "../qwenWorkDirectory";
import {
  readLocalSelection,
  useImportAttachments,
} from "../useImportAttachments";
import { useSaveNativeImport } from "../useImportDraft";
import { useQwenWorkDraft } from "../useQwenWorkDraft";
import { ImportNotice } from "./ImportNotice";
import type { ImportSourceProps } from "./ImportPanel";
import { QwenWorkPreview } from "./QwenWorkPreview";

function isNotQwenWorkDatabase(file: File) {
  return !/^(?:agents(?:\.identity-v2)?|qwenwork)\.db(?:-(?:wal|shm|journal))?$/i.test(
    file.name,
  );
}

export function QwenWorkImport({ ownerID, onSaved }: ImportSourceProps) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const draft = useQwenWorkDraft();
  const save = useSaveNativeImport(ownerID, onSaved);
  const attachments = useImportAttachments(
    draft.entries.find((entry) => entry.cwd)?.cwd ?? "",
    isNotQwenWorkDatabase,
  );
  const busy = draft.loading || save.pending;

  function chooseFolder() {
    const field = input.current;
    if (!field) return;
    field.setAttribute("webkitdirectory", "");
    field.click();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = readLocalSelection(event);
    if (!files.length || busy) return;
    attachments.clear();
    save.clearNotice();
    void draft.read(files);
  }

  function handleClear() {
    draft.clear();
    attachments.clear();
    save.clearNotice();
  }

  function handlePageChange(page: number) {
    if (busy || draft.selected.size) return;
    attachments.clear();
    save.clearNotice();
    void draft.changePage(page);
  }

  async function handleSave() {
    if (busy || !draft.selected.size) return;
    if (
      await save.submitSelected(
        draft.entries,
        draft,
        attachments.selectedFiles,
        checkQwenWorkAttachmentFiles,
      )
    )
      attachments.clearChecks();
  }

  return (
    <div className="space-y-3">
      <Text variant="body" tone="secondary">
        {t(
          "Choose your QwenWork history folder. Preview the conversations here before choosing what to save.",
          "直接选择千问办公的历史目录，在网页预览并勾选要保存的对话，无需先导出。",
        )}
      </Text>
      <Text variant="small" tone="secondary" className="break-words">
        {t(
          "Quit QwenWork before choosing its history folder. On Windows, paste %APPDATA%\\QwenWorkCN\\data into the folder picker.",
          "请先彻底退出千问办公，再在 Windows 目录选择框的地址栏输入 %APPDATA%\\QwenWorkCN\\data。",
        )}
      </Text>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        aria-label={t("QwenWork history folder", "千问办公历史目录")}
        disabled={busy}
        onChange={handleChange}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="small"
          leadingIcon={FolderOpenIcon}
          disabled={busy}
          loading={draft.loading}
          onClick={chooseFolder}
        >
          {t("Choose history folder", "选择历史目录")}
        </Button>
        {!!draft.result && (
          <Button
            type="button"
            variant="ghost"
            size="small"
            disabled={busy}
            onClick={handleClear}
          >
            {t("Clear folder", "清除目录")}
          </Button>
        )}
      </div>
      {draft.result && (
        <QwenWorkPreview
          draft={draft}
          attachments={attachments}
          busy={busy}
          onPageChange={handlePageChange}
        />
      )}
      {draft.entries.length > 0 && (
        <Button
          type="button"
          size="small"
          disabled={busy || !draft.selected.size}
          loading={save.pending}
          onClick={handleSave}
        >
          {t("Save selected", "保存选中对话")}
        </Button>
      )}
      <ImportNotice error={draft.error ?? save.error} result={save.result} />
    </div>
  );
}
