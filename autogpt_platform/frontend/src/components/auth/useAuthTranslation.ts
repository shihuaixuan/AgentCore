"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { usernameHelp } from "@/lib/auth/local-username";

const AUTH_MESSAGES: Record<string, string> = {
  [usernameHelp]:
    "用户名支持中文等字母、数字、下划线和连字符，最长 32 个 UTF-8 字节",
  "Invalid email": "请输入有效的邮箱地址",
  "Invalid email address": "请输入有效的邮箱地址",
  "Email must contain at most 128 characters": "邮箱地址不能超过 128 个字符",
  "Password must contain at least 6 characters": "密码至少需要 6 个字符",
  "Password must contain at least 12 characters": "密码至少需要 12 个字符",
  "Password must contain at most 64 characters": "密码不能超过 64 个字符",
  "Passwords don't match": "两次输入的密码不一致",
};

export function useAuthTranslation() {
  const { t } = useTranslation();

  function translateAuthMessage(message: string | null | undefined) {
    if (!message) return message;
    const chinese = Object.hasOwn(AUTH_MESSAGES, message)
      ? AUTH_MESSAGES[message]
      : undefined;
    return chinese ? t(message, chinese) : message;
  }

  return { translateAuthMessage };
}
