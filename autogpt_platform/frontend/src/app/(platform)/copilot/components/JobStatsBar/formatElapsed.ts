import type { Locale } from "@/lib/i18n/locale";

export function formatElapsed(
  totalSeconds: number,
  locale: Locale = "en",
): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (locale === "zh-CN") {
    return minutes === 0 ? `${seconds}秒` : `${minutes}分${seconds}秒`;
  }
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}
