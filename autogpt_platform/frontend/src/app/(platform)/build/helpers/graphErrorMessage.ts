import { englishDisplayText, type DisplayTranslate } from "./translation";

export function getGraphErrorMessage(
  error: unknown,
  t: DisplayTranslate = englishDisplayText,
) {
  if (typeof error === "object" && error !== null) {
    if (
      "detail" in error &&
      typeof error.detail === "string" &&
      error.detail.trim()
    )
      return error.detail;
    if (
      "message" in error &&
      typeof error.message === "string" &&
      error.message.trim()
    )
      return error.message;
  }
  return t("An unexpected error occurred.", "发生意外错误。");
}

export function getGraphValidationMessage(
  message: string | undefined,
  t: DisplayTranslate,
) {
  if (!message || message === "Workflow validation failed") {
    return t("Workflow validation failed", "工作流校验失败");
  }
  const counts =
    /^Workflow validation failed: (\d+) issues on (\d+) nodes$/.exec(message);
  return counts
    ? t(message, `工作流校验失败：${counts[2]} 个节点中有 ${counts[1]} 个问题`)
    : message;
}
