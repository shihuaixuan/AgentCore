import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { SaveResult } from "../api";
import { WorkBuddyPartialSaveError } from "../saveWorkBuddy";
import { ImportValidationError } from "../validation";

type Translate = ReturnType<typeof useTranslation>["t"];

function errorMessage(error: unknown, t: Translate) {
  if (error instanceof WorkBuddyPartialSaveError) {
    const { added, duplicates } = error.confirmed;
    return t(
      `Confirmed so far: ${added} new chats, ${duplicates} already archived. Some requests did not finish. You can retry this selection.`,
      `已确认：新增 ${added} 条，已有归档 ${duplicates} 条。部分请求未完成，可以重试当前选择。`,
    );
  }
  if (error === "read")
    return t(
      "Could not read the file. Choose it again.",
      "无法读取文件，请重新选择。",
    );
  if (!(error instanceof ImportValidationError)) {
    return t(
      "Could not save the conversations. Try again.",
      "无法保存对话，请重试。",
    );
  }
  switch (error.code) {
    case "json":
      return t("This file is not valid JSON.", "此文件不是有效的 JSON。");
    case "bundle":
      return t(
        "Choose a normalized WorkBuddy bundle (version 1).",
        "请选择规范化的 WorkBuddy 对话文件（版本 1）。",
      );
    case "files":
      return t("Choose up to 25 files at a time.", "一次最多选择 25 个文件。");
    case "file-size":
      return t(
        "Choose files totaling no more than 32 MiB.",
        "所选文件合计不能超过 32 MiB。",
      );
    case "file-type":
      return t(
        "Choose WorkBuddy .jsonl conversation files or a compatible .json bundle.",
        "请选择 WorkBuddy 的 .jsonl 会话文件或兼容的 .json 导出文件。",
      );
    case "transcript":
      return t(
        "A file is not a complete WorkBuddy text conversation. If WorkBuddy is still writing it, wait for the task to finish and try again.",
        "有文件不是完整的 WorkBuddy 文本会话。如果 WorkBuddy 还在写入，请等任务结束后重试。",
      );
    case "secure-context":
      return t(
        "Open the archive using HTTPS or localhost to import WorkBuddy files.",
        "请通过 HTTPS 或 localhost 打开归档，再导入 WorkBuddy 文件。",
      );
    case "conversation":
      return error.entry === undefined
        ? t(
            "A conversation has an invalid title, message, or timestamp.",
            "有会话的标题、消息或时间格式不符合导入要求。",
          )
        : t(
            `Conversation ${error.entry} is invalid. Check the source, ID, title, and messages.`,
            `第 ${error.entry} 条对话无效。请检查来源、ID、标题和消息。`,
          );
    case "manual":
      return t(
        "Enter a title (up to 200 characters), question and answer (up to 100,000 characters each).",
        "请输入标题（最多 200 字）、问题和回答（各最多 100,000 字）。",
      );
    case "selection":
      return t(
        "Select 1 to 25 conversations per save.",
        "每次请选择 1 至 25 条对话。",
      );
    case "size":
      return t(
        "The selection exceeds 4 MiB. Try selecting fewer or shorter conversations.",
        "所选对话超过 4 MiB，请减少数量或选择较短的对话。",
      );
    case "hosted-upload-size":
      return t(
        "On this deployment, each conversation and its selected files must fit within 4 MiB. Uncheck some attachments and try again.",
        "当前部署要求每条对话及其所选附件合计不超过 4 MiB，请取消勾选部分附件后重试。",
      );
  }
}

export function ImportNotice({
  error,
  result,
}: {
  error: unknown;
  result?: SaveResult | null;
}) {
  const { t } = useTranslation();
  if (error)
    return (
      <Text variant="body" tone="error-strong" role="alert">
        {errorMessage(error, t)}
      </Text>
    );
  if (!result) return null;
  return (
    <Text variant="body" tone="success-strong" role="status">
      {t(
        `Saved: ${result.added}. Duplicates skipped: ${result.duplicates}.`,
        `已保存 ${result.added} 条，已跳过 ${result.duplicates} 条重复对话。`,
      )}
    </Text>
  );
}
