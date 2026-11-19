import type { Locale } from "@/lib/i18n/locale";

type BudgetWindow = "daily" | "weekly" | "trial";
type RecurringWindow = "daily" | "weekly";

interface UsageWindowLike {
  percent_used: number;
  resets_at: string | Date;
}

interface UsageLike {
  daily?: UsageWindowLike | null;
  weekly?: UsageWindowLike | null;
  state?: "ok" | "low" | "exhausted";
  limiting_window?: BudgetWindow | null;
  resets_at?: string | Date | null;
}

export interface UsageBudget {
  state: "ok" | "low" | "exhausted";
  window: BudgetWindow | null;
  /** When the limiting window refills; null when nothing refills on its own. */
  resetsAt: Date | null;
  percentUsed: number | null;
}

export interface ResetWait {
  window: RecurringWindow;
  resetsAt: Date;
}

const LOW_PERCENT_USED = 80;
const NOTHING_LIMITING: UsageBudget = {
  state: "ok",
  window: null,
  resetsAt: null,
  percentUsed: null,
};

export function getUsageBudget(usage?: UsageLike | null): UsageBudget {
  if (!usage) return NOTHING_LIMITING;
  if (!usage.state) return estimateBudget(usage);
  const window = usage.limiting_window ?? null;
  return {
    state: usage.state,
    window,
    resetsAt: usage.state === "ok" ? null : toDate(usage.resets_at),
    percentUsed: window ? windowPercent(usage, window) : null,
  };
}

/** The reset a blocked chat can wait for, or null: trials, accounts without a
 *  plan and an unknown reset have nothing that refills on its own. */
export function getResetWait(budget?: UsageBudget | null): ResetWait | null {
  if (!budget || budget.state !== "exhausted" || !budget.resetsAt) return null;
  if (budget.window !== "daily" && budget.window !== "weekly") return null;
  return { window: budget.window, resetsAt: budget.resetsAt };
}

export function budgetOutTitle(window: RecurringWindow, locale: Locale = "en") {
  if (locale === "zh-CN")
    return window === "weekly" ? "你已用完本周预算" : "你已用完今日预算";
  return `You’re out of budget for ${window === "weekly" ? "this week" : "today"}`;
}

export function budgetResetSentence(
  wait: ResetWait,
  now = new Date(),
  locale: Locale = "en",
) {
  if (locale === "zh-CN") {
    const clock = wait.resetsAt.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const day =
      wait.window === "weekly"
        ? `${wait.resetsAt.toLocaleDateString("zh-CN", { weekday: "long" })} `
        : "";
    return `预算将于${day}${clock}（${formatCountdown(wait.resetsAt, now, locale)}）重置。你仍可浏览、编辑工作流和查看结果。`;
  }
  return `It resets ${formatResetMoment(wait, now)}. You can still browse, edit workflows and read results.`;
}

export function budgetLowHint(window: BudgetWindow, percentUsed: number) {
  const left = Math.max(1, Math.round(100 - percentUsed));
  const budget =
    window === "trial"
      ? "your trial allowance"
      : window === "weekly"
        ? "this week’s budget"
        : "today’s budget";
  return `About ${left}% of ${budget} left. A long task may pause partway.`;
}

export function formatResetClock(date: Date) {
  // Some ICU versions put a narrow no-break space before AM/PM.
  return date
    .toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })
    .replace(/ /g, " ");
}

export function formatWeekday(date: Date) {
  return date.toLocaleDateString("en", { weekday: "long" });
}

export function formatCountdown(
  date: Date,
  now = new Date(),
  locale: Locale = "en",
) {
  const minutes = Math.floor((date.getTime() - now.getTime()) / 60_000);
  if (locale === "zh-CN") {
    if (minutes < 1) return "不到 1 分钟后";
    if (minutes < 60) return `${minutes} 分钟后`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      const rest = minutes % 60;
      return rest ? `${hours} 小时 ${rest} 分钟后` : `${hours} 小时后`;
    }
    return `${Math.round(hours / 24)} 天后`;
  }
  if (minutes < 1) return "in under a minute";
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest ? `in ${hours} h ${rest} min` : `in ${hours} h`;
  }
  const days = Math.round(hours / 24);
  return days === 1 ? "in 1 day" : `in ${days} days`;
}

function formatResetMoment(wait: ResetWait, now: Date) {
  const clock = formatResetClock(wait.resetsAt);
  const when =
    wait.window === "weekly"
      ? `${formatWeekday(wait.resetsAt)} at ${clock}`
      : `at ${clock}`;
  return `${when}, ${formatCountdown(wait.resetsAt, now)}`;
}

// Older backends don't send the verdict. Without it there is no telling a
// window that refills from one that never does (a trial, or no plan), so an
// estimate never promises a reset.
function estimateBudget(usage: UsageLike): UsageBudget {
  const windows = (["daily", "weekly"] as const).flatMap((name) => {
    const reading = usage[name];
    return reading
      ? [{ name, percent: reading.percent_used, resetsAt: reading.resets_at }]
      : [];
  });
  const exhausted = windows.filter((reading) => reading.percent >= 100);
  if (exhausted.length > 0) {
    const last = exhausted.reduce((a, b) =>
      time(b.resetsAt) >= time(a.resetsAt) ? b : a,
    );
    return {
      state: "exhausted",
      window: last.name,
      resetsAt: null,
      percentUsed: 100,
    };
  }
  const tightest = windows.reduce<(typeof windows)[number] | null>(
    (a, b) => (!a || b.percent >= a.percent ? b : a),
    null,
  );
  if (!tightest || tightest.percent < LOW_PERCENT_USED) return NOTHING_LIMITING;
  return {
    state: "low",
    window: tightest.name,
    resetsAt: toDate(tightest.resetsAt),
    percentUsed: tightest.percent,
  };
}

function windowPercent(usage: UsageLike, window: BudgetWindow) {
  const reading = window === "trial" ? usage.weekly : usage[window];
  return reading?.percent_used ?? null;
}

function toDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function time(value: string | Date) {
  return new Date(value).getTime() || 0;
}
