"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/components/SelectPrimitives";
import { Label } from "@/components/atoms/Label/Label";
import { BaseInput } from "@/components/atoms/Input/BaseInput";
import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import { CronFrequency, makeCronExpression } from "@/lib/cron-expression-utils";

const weekDays = [
  { label: "Su", value: 0 },
  { label: "Mo", value: 1 },
  { label: "Tu", value: 2 },
  { label: "We", value: 3 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
];

const months = [
  { label: "Jan", value: "January" },
  { label: "Feb", value: "February" },
  { label: "Mar", value: "March" },
  { label: "Apr", value: "April" },
  { label: "May", value: "May" },
  { label: "Jun", value: "June" },
  { label: "Jul", value: "July" },
  { label: "Aug", value: "August" },
  { label: "Sep", value: "September" },
  { label: "Oct", value: "October" },
  { label: "Nov", value: "November" },
  { label: "Dec", value: "December" },
];

type CronSchedulerProps = {
  onCronExpressionChange: (cronExpression: string) => void;
  initialCronExpression?: string;
};

export function CronScheduler({
  onCronExpressionChange,
  initialCronExpression,
}: CronSchedulerProps): React.ReactElement {
  const { t } = useTranslation();

  const [frequency, setFrequency] = useState<CronFrequency>("daily");
  const [selectedMinute, setSelectedMinute] = useState<string>("0");
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [customInterval, setCustomInterval] = useState<{
    value: number;
    unit: "minutes" | "hours" | "days";
  }>({ value: 1, unit: "minutes" });

  // Parse initial cron expression and set state
  useEffect(() => {
    if (!initialCronExpression) {
      // Reset to defaults when no initial expression
      setFrequency("daily");
      setSelectedWeekDays([]);
      setSelectedMonthDays([]);
      setSelectedMonths([]);
      return;
    }

    const parts = initialCronExpression.trim().split(/\s+/);
    if (parts.length !== 5) return;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Reset all state first
    setSelectedWeekDays([]);
    setSelectedMonthDays([]);
    setSelectedMonths([]);

    // Parse patterns in order of specificity
    if (
      minute === "*" &&
      hour === "*" &&
      dayOfMonth === "*" &&
      month === "*" &&
      dayOfWeek === "*"
    ) {
      setFrequency("every minute");
    } else if (
      hour === "*" &&
      dayOfMonth === "*" &&
      month === "*" &&
      dayOfWeek === "*" &&
      !minute.includes("/")
    ) {
      setFrequency("hourly");
      setSelectedMinute(minute);
    } else if (
      minute.startsWith("*/") &&
      hour === "*" &&
      dayOfMonth === "*" &&
      month === "*" &&
      dayOfWeek === "*"
    ) {
      setFrequency("custom");
      const interval = parseInt(minute.substring(2));
      if (!isNaN(interval)) {
        setCustomInterval({ value: interval, unit: "minutes" });
      }
    } else if (
      hour.startsWith("*/") &&
      minute === "0" &&
      dayOfMonth === "*" &&
      month === "*" &&
      dayOfWeek === "*"
    ) {
      setFrequency("custom");
      const interval = parseInt(hour.substring(2));
      if (!isNaN(interval)) {
        setCustomInterval({ value: interval, unit: "hours" });
      }
    } else if (
      dayOfMonth.startsWith("*/") &&
      month === "*" &&
      dayOfWeek === "*" &&
      !minute.includes("/") &&
      !hour.includes("/")
    ) {
      setFrequency("custom");
      const interval = parseInt(dayOfMonth.substring(2));
      if (!isNaN(interval)) {
        setCustomInterval({ value: interval, unit: "days" });
        const hourNum = parseInt(hour);
        const minuteNum = parseInt(minute);
        if (!isNaN(hourNum) && !isNaN(minuteNum)) {
          setSelectedTime(
            `${hourNum.toString().padStart(2, "0")}:${minuteNum.toString().padStart(2, "0")}`,
          );
        }
      }
    } else if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      setFrequency("daily");
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      if (!isNaN(hourNum) && !isNaN(minuteNum)) {
        setSelectedTime(
          `${hourNum.toString().padStart(2, "0")}:${minuteNum.toString().padStart(2, "0")}`,
        );
      }
    } else if (dayOfWeek !== "*" && dayOfMonth === "*" && month === "*") {
      setFrequency("weekly");
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      if (!isNaN(hourNum) && !isNaN(minuteNum)) {
        setSelectedTime(
          `${hourNum.toString().padStart(2, "0")}:${minuteNum.toString().padStart(2, "0")}`,
        );
      }
      const days = dayOfWeek
        .split(",")
        .map((d) => parseInt(d))
        .filter((d) => !isNaN(d));
      setSelectedWeekDays(days);
    } else if (dayOfMonth !== "*" && month === "*" && dayOfWeek === "*") {
      setFrequency("monthly");
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      if (!isNaN(hourNum) && !isNaN(minuteNum)) {
        setSelectedTime(
          `${hourNum.toString().padStart(2, "0")}:${minuteNum.toString().padStart(2, "0")}`,
        );
      }
      const days = dayOfMonth
        .split(",")
        .map((d) => parseInt(d))
        .filter((d) => !isNaN(d) && d >= 1 && d <= 31);
      setSelectedMonthDays(days);
    } else if (dayOfMonth !== "*" && month !== "*" && dayOfWeek === "*") {
      setFrequency("yearly");
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      if (!isNaN(hourNum) && !isNaN(minuteNum)) {
        setSelectedTime(
          `${hourNum.toString().padStart(2, "0")}:${minuteNum.toString().padStart(2, "0")}`,
        );
      }
      const months = month
        .split(",")
        .map((m) => parseInt(m))
        .filter((m) => !isNaN(m) && m >= 1 && m <= 12);
      setSelectedMonths(months);
    }
  }, [initialCronExpression]);

  useEffect(() => {
    const cronExpr = makeCronExpression({
      frequency,
      minute:
        frequency === "hourly"
          ? parseInt(selectedMinute)
          : parseInt(selectedTime.split(":")[1]),
      hour: parseInt(selectedTime.split(":")[0]),
      days:
        frequency === "weekly"
          ? selectedWeekDays
          : frequency === "monthly"
            ? selectedMonthDays
            : [],
      months: frequency === "yearly" ? selectedMonths : [],
      customInterval:
        frequency === "custom" ? customInterval : { unit: "minutes", value: 1 },
    });
    onCronExpressionChange(cronExpr);
  }, [
    frequency,
    selectedMinute,
    selectedTime,
    selectedWeekDays,
    selectedMonthDays,
    selectedMonths,
    customInterval,
    onCronExpressionChange,
  ]);

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-4">
        <Label>
          <Text variant="large-medium-tight" as="span" tone="inherit">
            {t("Repeat", "重复")}
          </Text>
        </Label>

        <Select
          value={frequency}
          onValueChange={(value: CronFrequency) => setFrequency(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Select frequency", "选择频率")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hourly">{t("Every Hour", "每小时")}</SelectItem>
            <SelectItem value="daily">{t("Daily", "每天")}</SelectItem>
            <SelectItem value="weekly">{t("Weekly", "每周")}</SelectItem>
            <SelectItem value="monthly">{t("Monthly", "每月")}</SelectItem>
            <SelectItem value="yearly">{t("Yearly", "每年")}</SelectItem>
            <SelectItem value="custom">{t("Custom", "自定义")}</SelectItem>
          </SelectContent>
        </Select>

        {frequency === "hourly" && (
          <div className="flex items-center gap-2">
            <Label>{t("At minute", "在第几分钟")}</Label>
            <Select value={selectedMinute} onValueChange={setSelectedMinute}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder={t("Select minute", "选择分钟")} />
              </SelectTrigger>
              <SelectContent>
                {[0, 15, 30, 45].map((min) => (
                  <SelectItem key={min} value={min.toString()}>
                    {min}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {frequency === "custom" && (
          <div className="flex items-center gap-2">
            <Label>{t("Every", "每隔")}</Label>
            <BaseInput
              type="number"
              min="1"
              className="w-20"
              value={customInterval.value}
              onChange={(e) =>
                setCustomInterval({
                  ...customInterval,
                  value: parseInt(e.target.value),
                })
              }
            />
            <Select
              value={customInterval.unit}
              onValueChange={(value: any) =>
                setCustomInterval({ ...customInterval, unit: value })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">{t("Minutes", "分钟")}</SelectItem>
                <SelectItem value="hours">{t("Hours", "小时")}</SelectItem>
                <SelectItem value="days">{t("Days", "天")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {frequency === "weekly" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>{t("On", "在")}</Label>
            <Button
              variant="compact-outline"
              size="compact-sm"
              onClick={() => {
                if (selectedWeekDays.length === weekDays.length) {
                  setSelectedWeekDays([]);
                } else {
                  setSelectedWeekDays(weekDays.map((day) => day.value));
                }
              }}
            >
              <Text variant="small-medium-tight" as="span" tone="inherit">
                {selectedWeekDays.length === weekDays.length
                  ? t("Deselect All", "取消全选")
                  : t("Select All", "全选")}
              </Text>
            </Button>
            <Button
              variant="compact-outline"
              size="compact-sm"
              onClick={() => setSelectedWeekDays([1, 2, 3, 4, 5])}
            >
              <Text variant="small-medium-tight" as="span" tone="inherit">
                {t("Weekdays", "工作日")}
              </Text>
            </Button>
            <Button
              variant="compact-outline"
              size="compact-sm"
              onClick={() => setSelectedWeekDays([0, 6])}
            >
              <Text variant="small-medium-tight" as="span" tone="inherit">
                {t("Weekends", "周末")}
              </Text>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {weekDays.map((day) => (
              <Button
                key={day.value}
                variant={
                  selectedWeekDays.includes(day.value)
                    ? "compact-primary"
                    : "compact-outline"
                }
                size="compact-icon"
                className="h-10 w-10"
                onClick={() => {
                  setSelectedWeekDays((prev) =>
                    prev.includes(day.value)
                      ? prev.filter((d) => d !== day.value)
                      : [...prev, day.value],
                  );
                }}
              >
                {t(
                  day.label,
                  ["日", "一", "二", "三", "四", "五", "六"][day.value],
                )}
              </Button>
            ))}
          </div>
          {selectedWeekDays.length === 0 && (
            <Text variant="body-tight" tone="error">
              {t(
                "Please select at least one day of the week",
                "请至少选择一周中的一天",
              )}
            </Text>
          )}
        </div>
      )}
      {frequency === "monthly" && (
        <div className="space-y-4">
          <Label>{t("Days of Month", "每月日期")}</Label>
          <div className="flex gap-2">
            <Button
              variant={
                selectedMonthDays.length === 31
                  ? "compact-primary"
                  : "compact-outline"
              }
              size="compact"
              onClick={() => {
                setSelectedMonthDays(
                  Array.from({ length: 31 }, (_, i) => i + 1),
                );
              }}
            >
              {t("All Days", "所有日期")}
            </Button>
            <Button
              variant={
                selectedMonthDays.length < 31 && selectedMonthDays.length > 0
                  ? "compact-primary"
                  : "compact-outline"
              }
              size="compact"
              onClick={() => {
                setSelectedMonthDays([]);
              }}
            >
              {t("Customize", "自定义")}
            </Button>
            <Button
              variant="compact-outline"
              size="compact"
              onClick={() => setSelectedMonthDays([15])}
            >
              {t("15th", "15 日")}
            </Button>
            <Button
              variant="compact-outline"
              size="compact"
              onClick={() => setSelectedMonthDays([31])}
            >
              {t("Last Day", "最后一天")}
            </Button>
          </div>
          {selectedMonthDays.length < 31 && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 31 }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={
                    selectedMonthDays.includes(i + 1)
                      ? "compact-primary"
                      : "compact-outline"
                  }
                  size="compact-icon"
                  className="h-10 w-10"
                  onClick={() => {
                    setSelectedMonthDays((prev) =>
                      prev.includes(i + 1)
                        ? prev.filter((d) => d !== i + 1)
                        : [...prev, i + 1],
                    );
                  }}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
          {selectedMonthDays.length === 0 && (
            <Text variant="body-tight" tone="error">
              {t(
                "Please select at least one day of the month",
                "请至少选择每月的一天",
              )}
            </Text>
          )}
        </div>
      )}
      {frequency === "yearly" && (
        <div className="space-y-4">
          <Label>{t("Months", "月份")}</Label>
          <div className="flex gap-2">
            <Button
              variant="compact-outline"
              size="compact-sm"
              onClick={() => {
                if (selectedMonths.length === months.length) {
                  setSelectedMonths([]);
                } else {
                  setSelectedMonths(
                    Array.from({ length: 12 }, (_, i) => i + 1),
                  );
                }
              }}
            >
              <Text variant="small-medium-tight" as="span" tone="inherit">
                {selectedMonths.length === months.length
                  ? t("Deselect All", "取消全选")
                  : t("Select All", "全选")}
              </Text>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {months.map((month, i) => {
              const monthNumber = i + 1;
              return (
                <Button
                  key={i}
                  variant={
                    selectedMonths.includes(monthNumber)
                      ? "compact-primary"
                      : "compact-outline"
                  }
                  size="compact"
                  className="px-2"
                  onClick={() => {
                    setSelectedMonths((prev) =>
                      prev.includes(monthNumber)
                        ? prev.filter((m) => m !== monthNumber)
                        : [...prev, monthNumber],
                    );
                  }}
                >
                  {t(month.label, `${monthNumber} 月`)}
                </Button>
              );
            })}
          </div>
          {selectedMonths.length === 0 && (
            <Text variant="body-tight" tone="error">
              {t("Please select at least one month", "请至少选择一个月份")}
            </Text>
          )}
        </div>
      )}

      {frequency !== "hourly" &&
        !(frequency === "custom" && customInterval.unit !== "days") && (
          <div className="flex items-center gap-4 space-y-2">
            <Label className="pt-2">{t("At", "时间")}</Label>
            <BaseInput
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>
        )}
    </div>
  );
}
