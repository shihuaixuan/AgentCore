import type { useTranslation } from "@/lib/i18n/LanguageProvider";
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function formatUntil(
  nextRunTime: Date,
  now = new Date(),
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
  locale?: string,
) {
  const runAt = new Date(nextRunTime);
  const diffMs = runAt.getTime() - now.getTime();
  if (Number.isNaN(runAt.getTime())) return "";
  if (diffMs <= 60_000) return t("now", "现在");
  if (diffMs < DAY_MS) {
    const totalMinutes = Math.round(diffMs / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return t(`in ${minutes}m`, `${minutes} 分钟后`);
    return minutes > 0
      ? t(`in ${hours}h ${minutes}m`, `${hours} 小时 ${minutes} 分钟后`)
      : t(`in ${hours}h`, `${hours} 小时后`);
  }
  return runAt.toLocaleString(locale, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRunningFor(
  startedAt: Date | null | undefined,
  now = new Date(),
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
) {
  if (!startedAt) return null;
  const started = new Date(startedAt);
  if (Number.isNaN(started.valueOf())) return null;
  const totalMinutes = Math.floor((now.getTime() - started.getTime()) / 60_000);
  if (totalMinutes < 1)
    return t("Running for less than a minute", "已运行不到一分钟");
  if (totalMinutes < 60)
    return t(`Running for ${totalMinutes}m`, `已运行 ${totalMinutes} 分钟`);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0
    ? t(
        `Running for ${hours}h ${minutes}m`,
        `已运行 ${hours} 小时 ${minutes} 分钟`,
      )
    : t(`Running for ${hours}h`, `已运行 ${hours} 小时`);
}
