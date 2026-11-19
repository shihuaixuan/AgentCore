import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/locale";

export function maskAPIKey(head: string, tail: string): string {
  return `${head}••••••••${tail}`;
}

export function formatLastUsed(
  lastUsedAt: Date | string | null | undefined,
  locale: Locale = "en",
): string {
  if (!lastUsedAt) return locale === "zh-CN" ? "从未使用" : "Never used";
  if (locale === "zh-CN")
    return `上次使用：${formatDistanceToNow(new Date(lastUsedAt), { addSuffix: true, locale: zhCN })}`;
  return `Used ${formatDistanceToNow(new Date(lastUsedAt), { addSuffix: true })}`;
}
