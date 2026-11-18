import { safeHumanizeCronExpression } from "@/lib/cron-expression-utils";
import type { Locale } from "@/lib/i18n/locale";

// The humanizer falls back to "Scheduled" or "Cron Expression: …", neither of
// which reads after "Runs".
export function getCadenceLabel(cron: string, locale: Locale = "en") {
  if (locale === "zh-CN") return getChineseCadenceLabel(cron);
  const phrase = safeHumanizeCronExpression(cron);
  if (!/^(Every|On day)\b/.test(phrase)) return "Runs on a schedule";
  return `Runs ${phrase.charAt(0).toLowerCase()}${phrase.slice(1)}`;
}

function getChineseCadenceLabel(cron: string) {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return "按计划运行";
  const [minute, hour, day, month, weekday] = fields;
  const numericTime = /^\d+$/.test(minute) && /^\d+$/.test(hour);
  const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

  if (day === "*" && month === "*" && weekday === "*") {
    if (minute === "*" && hour === "*") return "每分钟运行";
    if (/^\*\/\d+$/.test(minute) && hour === "*") {
      return `每 ${minute.slice(2)} 分钟运行`;
    }
    if (minute === "0" && /^\*\/\d+$/.test(hour)) {
      return `每 ${hour.slice(2)} 小时运行`;
    }
    if (/^\d+$/.test(minute) && hour === "*") {
      return `每小时第 ${minute} 分钟运行`;
    }
    if (numericTime) return `每天 ${time} 运行`;
  }

  if (
    numericTime &&
    month === "*" &&
    day === "*" &&
    /^[0-6](,[0-6])*$/.test(weekday)
  ) {
    const days = weekday
      .split(",")
      .map(
        (value) =>
          ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
            Number(value)
          ],
      );
    return `每${days.join("、")} ${time} 运行`;
  }

  if (numericTime && month === "*" && weekday === "*") {
    if (/^\d+(,\d+)*$/.test(day)) {
      return `每月 ${day.split(",").join("、")} 日 ${time} 运行`;
    }
    if (/^\*\/\d+$/.test(day)) {
      return `每 ${day.slice(2)} 天 ${time} 运行`;
    }
  }

  return "按计划运行";
}
