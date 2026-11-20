import type { Locale } from "@/lib/i18n/locale";
import { AUTOPILOT_NAME } from "@/lib/branding";

export const DEFAULT_ASSISTANT_AVATAR_URL =
  "/experts/professional/office-assistant.webp";

/** The built-in assistant's display title; the chat API still routes to `otto`. */
export function getDefaultAssistantTitle(locale: Locale): string {
  return locale === "zh-CN" ? AUTOPILOT_NAME : "General Office Assistant";
}
