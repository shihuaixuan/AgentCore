import { CredentialsMetaInput } from "@/app/api/__generated__/models/credentialsMetaInput";
import { isEmpty } from "@/lib/utils";
import {
  englishDisplayText,
  type DisplayTranslate,
} from "@/app/(platform)/library/helpers/translation";

export function validateInputs(
  inputSchema: any,
  values: Record<string, any>,
  t: DisplayTranslate = englishDisplayText,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!inputSchema?.properties) return errors;

  const requiredFields = inputSchema.required || [];

  for (const fieldName of requiredFields) {
    const fieldSchema = inputSchema.properties[fieldName];
    if (!fieldSchema?.hidden && isEmpty(values[fieldName])) {
      const title = fieldSchema?.title || fieldName;
      errors[fieldName] = t(`${title} is required`, `${title} 为必填项`);
    }
  }

  return errors;
}

export function validateCredentials(
  credentialsSchema: any,
  values: Record<string, CredentialsMetaInput>,
  t: DisplayTranslate = englishDisplayText,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!credentialsSchema?.properties) return errors;

  const credentialFields = Object.keys(credentialsSchema.properties);

  for (const fieldName of credentialFields) {
    if (!values[fieldName]) {
      errors[fieldName] = t(
        `${fieldName} credentials are required`,
        `需要提供 ${fieldName} 的凭据`,
      );
    }
  }

  return errors;
}

export function formatCronExpression(
  cron: string,
  t: DisplayTranslate = englishDisplayText,
): string {
  // Basic cron expression formatting/validation
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(
      t(
        "Cron expression must have exactly 5 parts: minute hour day month weekday",
        "Cron 表达式必须包含 5 个部分：分钟、小时、日期、月份、星期",
      ),
    );
  }
  return parts.join(" ");
}

export function parseCronDescription(
  cron: string,
  t: DisplayTranslate = englishDisplayText,
): string {
  // Simple cron description parser
  const parts = cron.split(" ");
  if (parts.length !== 5) return cron;

  // Handle some common patterns
  if (cron === "0 * * * *") return t("Every hour", "每小时");
  if (cron === "0 9 * * *") return t("Daily at 9:00 AM", "每天上午 9:00");
  if (cron === "0 9 * * 1")
    return t("Every Monday at 9:00 AM", "每周一上午 9:00");
  if (cron === "0 9 * * 1-5")
    return t("Weekdays at 9:00 AM", "工作日上午 9:00");
  if (cron === "0 9 1 * *")
    return t("Monthly on the 1st at 9:00 AM", "每月 1 日上午 9:00");

  return cron; // Fallback to showing the raw cron
}
