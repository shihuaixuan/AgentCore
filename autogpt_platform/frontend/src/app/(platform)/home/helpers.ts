import type { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { HomeDashboardResponse } from "@/app/api/__generated__/models/homeDashboardResponse";

export function getTimeOfDayGreeting(hour = new Date().getHours()) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function getHomeStatusLine(
  dashboard: HomeDashboardResponse,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
): string {
  const attention = dashboard.attention.length;
  const active = dashboard.active_tasks.length;
  if (attention > 0 && active > 0) {
    return t(
      `${attention} ${attention === 1 ? "decision" : "decisions"} waiting · ${active} ${active === 1 ? "workflow is" : "workflows are"} running now`,
      `${attention} 项决策待处理 · ${active} 个工作流正在运行`,
    );
  }
  if (attention > 0) {
    return t(
      `${attention} ${attention === 1 ? "decision needs" : "decisions need"} you`,
      `${attention} 项决策需要你处理`,
    );
  }
  if (active > 0) {
    return t(
      `All clear · ${active} ${active === 1 ? "workflow is" : "workflows are"} running now`,
      `暂无待办 · ${active} 个工作流正在运行`,
    );
  }
  return t("Nothing needs you right now", "目前没有需要你处理的事项");
}

export function formatHeaderDate(
  value: Date,
  timeZone: string,
  locale?: string,
) {
  const date = new Date(value);
  const options = { timeZone };

  return {
    weekday: new Intl.DateTimeFormat(locale, {
      ...options,
      weekday: "long",
    }).format(date),
    calendarDate: new Intl.DateTimeFormat(locale, {
      ...options,
      month: "long",
      day: "numeric",
    }).format(date),
  };
}

export function formatDuration(
  totalSeconds: number,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return t(`${minutes}m`, `${minutes} 分钟`);
  if (minutes === 0) return t(`${hours}h`, `${hours} 小时`);
  return t(`${hours}h ${minutes}m`, `${hours} 小时 ${minutes} 分钟`);
}

// Null rather than "$0.00 this week" so a brand-new or idle expert reads as
// having no spend line at all instead of an explicit zero.
export function formatWeeklySpend(
  cents: number | undefined,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
): string | null {
  if (!cents || cents <= 0) return null;
  return t(
    `${formatCurrency(cents)} this week`,
    `本周 ${formatCurrency(cents)}`,
  );
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
