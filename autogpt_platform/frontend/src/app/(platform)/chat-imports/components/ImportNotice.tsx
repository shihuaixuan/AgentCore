import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { SaveResult } from "../api";
import { PartialArchiveSaveError } from "../saveNativeChats";
import { ImportValidationError } from "../validation";

type Translate = ReturnType<typeof useTranslation>["t"];

function errorMessage(error: unknown, t: Translate) {
  if (error instanceof PartialArchiveSaveError) {
    const { added, duplicates } = error.confirmed;
    if (
      error.cause instanceof ImportValidationError &&
      error.cause.code === "archive-destination"
    ) {
      return t(
        `Confirmed so far: ${added} new chats, ${duplicates} already archived. The archive account changed; remaining saves were stopped.`,
        `已确认：新增 ${added} 条，已有归档 ${duplicates} 条。归档账号已变化，剩余保存已停止。`,
      );
    }
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
    case "workbuddy-folder":
      return t(
        "No WorkBuddy history was found. Choose the projects folder or one of its project folders.",
        "未找到 WorkBuddy 会话文件。请选择 projects 目录或其中的项目目录。",
      );
    case "qwenwork-folder":
      return t(
        "QwenWork history not found. Select %APPDATA%\\QwenWorkCN\\data on Windows.",
        "未找到千问办公历史库。Windows 下请选择 %APPDATA%\\QwenWorkCN\\data。",
      );
    case "qwenwork-busy":
      return t(
        "QwenWork has a pending database journal. Quit the app completely and choose the history folder again.",
        "千问办公历史库还有未合并的写入日志。请彻底退出客户端后重新选择历史目录。",
      );
    case "qwenwork-db-size":
      return t(
        "This QwenWork history exceeds the 64 MiB local import limit.",
        "千问办公历史库超过 64 MiB 的本地导入上限。",
      );
    case "qwenwork-database":
      return t(
        "This is not a supported QwenWork history database, or the file is incomplete.",
        "不是受支持的千问办公历史库，或文件不完整。",
      );
    case "qwenwork-reader":
      return t(
        "The browser could not read this history. Try again in a current version of Chrome or Edge.",
        "浏览器无法读取此历史库，请用最新版 Chrome 或 Edge 重试。",
      );
    case "qwenwork-db-attachment":
      return t(
        "Database files cannot be saved as attachments. Uncheck the database file and try again.",
        "不能将数据库作为附件保存。请取消勾选数据库文件后重试。",
      );
    case "archive-destination":
      return t(
        "The archive account changed. Confirm the signed-in account before saving again.",
        "归档账号已变化。请确认当前登录账号后再保存。",
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
