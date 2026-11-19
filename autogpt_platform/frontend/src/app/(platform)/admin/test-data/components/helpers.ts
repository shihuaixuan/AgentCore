import type { Locale } from "@/lib/i18n/locale";

const FALLBACK_ERROR_DETAIL = "Failed to generate test data. Please try again.";

export function getErrorDetail(error: unknown, locale: Locale = "en") {
  if (error instanceof Error && error.message) return error.message;
  return locale === "zh-CN"
    ? "无法生成测试数据，请重试。"
    : FALLBACK_ERROR_DETAIL;
}
