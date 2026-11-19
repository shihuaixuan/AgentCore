import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { englishDisplayText, type DisplayTranslate } from "./translation";

/** A 4xx won't heal on retry — fail fast instead of stalling ~7s in backoff. */
export function retryUnlessClientError(
  failureCount: number,
  error: unknown,
): boolean {
  const status = error instanceof ApiError ? error.status : undefined;
  return (
    failureCount < 3 && !(status !== undefined && status >= 400 && status < 500)
  );
}

export function getGraphLoadErrorToast(
  error: unknown,
  t: DisplayTranslate = englishDisplayText,
): {
  title: string;
  description: string;
} {
  const status = error instanceof ApiError ? error.status : undefined;
  const description =
    error instanceof Error && error.message
      ? error.message
      : t("An unexpected error occurred.", "发生意外错误。");

  if (status === 404) {
    return { title: t("Workflow not found", "未找到工作流"), description };
  }
  if (status === 401 || status === 403) {
    return {
      title: t("Not authorized to view this workflow", "无权查看此工作流"),
      description,
    };
  }
  return { title: t("Failed to load workflow", "无法加载工作流"), description };
}
