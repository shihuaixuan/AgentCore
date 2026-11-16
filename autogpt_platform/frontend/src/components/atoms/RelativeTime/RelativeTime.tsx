"use client";

import { useNowMinute } from "@/hooks/useNowMinute";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  date: Date | string | number;
}

/**
 * `date` relative to now, e.g. "5 minutes ago". It re-renders on the shared
 * minute clock, so the label keeps up with time without a timer of its own
 * and without its parent re-rendering.
 */
export function RelativeTime({ date }: Props) {
  const { locale } = useTranslation();
  useNowMinute();
  return (
    <>
      {formatDistanceToNow(date, {
        addSuffix: true,
        locale: locale === "zh-CN" ? zhCN : undefined,
      })}
    </>
  );
}
