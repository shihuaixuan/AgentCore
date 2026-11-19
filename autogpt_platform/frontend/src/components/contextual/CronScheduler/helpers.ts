import { safeHumanizeCronExpression } from "@/lib/cron-expression-utils";
import type { Locale } from "@/lib/i18n/locale";

export function describeCron(cron: string, locale: Locale = "en"): string {
  return safeHumanizeCronExpression(cron, locale);
}
