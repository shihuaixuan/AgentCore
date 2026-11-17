import { safeHumanizeCronExpression } from "@/lib/cron-expression-utils";

export function describeCron(
  cron: string,
  t: (english: string, chinese: string) => string,
): string {
  const english = safeHumanizeCronExpression(cron);
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return t(english, "已安排运行");
  const [minute, hour, day, month, weekday] = fields;
  const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  let chinese = `运行计划（Cron）：${cron}`;
  if (cron === "* * * * *") chinese = "每分钟";
  else if (day === "*" && month === "*" && weekday === "*") {
    if (/^\*\/\d+$/.test(minute) && hour === "*")
      chinese = `每 ${minute.slice(2)} 分钟`;
    else if (/^\*\/\d+$/.test(hour) && minute === "0")
      chinese = `每 ${hour.slice(2)} 小时`;
    else if (/^\d+$/.test(minute) && hour === "*")
      chinese = `每小时的第 ${minute} 分钟`;
    else if (/^\d+$/.test(minute) && /^\d+$/.test(hour))
      chinese = `每天 ${time}`;
  } else if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) {
    if (month === "*" && weekday === "*" && /^\*\/\d+$/.test(day))
      chinese = `每 ${day.slice(2)} 天 ${time}`;
    else if (month === "*" && weekday === "*" && /^\d+(,\d+)*$/.test(day))
      chinese = `每月 ${day.split(",").join("、")} 日 ${time}`;
    else if (day === "*" && month === "*" && /^\d+(,\d+)*$/.test(weekday)) {
      const days = weekday.split(",").map(Number);
      if (days.every((value) => value >= 0 && value <= 7))
        chinese = `每周${days.map((value) => ["日", "一", "二", "三", "四", "五", "六"][value % 7]).join("、")} ${time}`;
    } else if (
      /^\d+(,\d+)*$/.test(month) &&
      /^\d+$/.test(day) &&
      weekday === "*"
    )
      chinese = `每年 ${month.split(",").join("、")} 月 ${day} 日 ${time}`;
  }
  return t(english, chinese);
}
