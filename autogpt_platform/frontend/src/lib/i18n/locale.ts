export type Locale = "zh-CN" | "en";

export const LOCALE_COOKIE_NAME = "autogpt-locale";

export function parseLocale(value: string | undefined): Locale {
  return value === "en" ? "en" : "zh-CN";
}
