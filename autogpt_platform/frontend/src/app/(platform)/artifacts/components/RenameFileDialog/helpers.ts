import type { Locale } from "@/lib/i18n/locale";

export const MAX_FILE_NAME_LENGTH = 255;

export function validateFileName(
  name: string,
  locale: Locale = "en",
): string | null {
  if (name.length === 0)
    return locale === "zh-CN" ? "请输入文件名" : "Enter a file name";
  if (name.length > MAX_FILE_NAME_LENGTH)
    return locale === "zh-CN" ? "文件名过长" : "That name is too long";
  if (name === "." || name === "..")
    return locale === "zh-CN" ? "文件名无效" : "That is not a valid file name";
  if (name.includes("/") || name.includes("\\"))
    return locale === "zh-CN"
      ? "文件名不能包含斜杠"
      : "File names cannot contain slashes";
  return null;
}
