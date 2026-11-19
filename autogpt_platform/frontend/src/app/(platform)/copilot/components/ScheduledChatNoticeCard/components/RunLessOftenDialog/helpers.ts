import { ApiError } from "@/lib/autogpt-server-api/helpers";
import type { Locale } from "@/lib/i18n/locale";

// "Every Monday at 09:00" reads "every Monday at 09:00" mid-sentence.
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

// Why the API won't touch this chat's cadence, read or change.
export function refusalText(
  error: unknown,
  locale: Locale = "en",
): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 409)
    return locale === "zh-CN"
      ? "已暂停。请先恢复运行。"
      : "It's paused. Resume it first.";
  if (error.status === 404)
    return locale === "zh-CN"
      ? "此任务已不再使用可在此修改的计划。"
      : "It no longer runs on a schedule this can change.";
  return null;
}

// The refusals the API names; anything else is ours.
export function changeErrorText(
  error: unknown,
  locale: Locale = "en",
): string | null {
  if (error instanceof ApiError && error.status === 400)
    return locale === "zh-CN"
      ? "请选择显示的一个选项。"
      : "Pick one of the options shown.";
  return refusalText(error, locale);
}
