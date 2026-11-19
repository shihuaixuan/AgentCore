"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

const COPY: Record<string, string> = {
  "Invalid email or password": "邮箱或密码无效",
  "Failed to login. Please try again.": "登录失败，请重试。",
  "Invalid signup payload": "注册信息无效",
  "Failed to complete account setup. Please try again.":
    "无法完成账户设置，请重试。",
  "Failed to sign up. Please try again.": "注册失败，请重试。",
  "An AutoGPT team address signs up with Google. Use Continue with Google instead.":
    "AutoGPT 团队邮箱需要通过 Google 注册。请选择“使用 Google 继续”。",
  "Microsoft didn't share an email address for that account, so it can't sign in here. Use another sign-in method.":
    "Microsoft 未提供此账户的邮箱地址，因此无法登录。请使用其他登录方式。",
  "We can't sign you in with that Microsoft account. If you already have an AutoGPT account, log in the way you usually do. If not, sign up with your email address. You can connect Microsoft 365 afterwards.":
    "无法使用此 Microsoft 账户登录。如果已有 AutoGPT 账户，请使用原来的方式登录；否则，请用邮箱注册。之后仍可连接 Microsoft 365。",
  "Microsoft sign-in was cancelled.": "Microsoft 登录已取消。",
  "This sign-in isn't allowed. Contact support if you think this is a mistake.":
    "不允许此次登录。如有异议，请联系支持团队。",
  "This sign-up isn't allowed. Use another sign-in method, or contact support if you think this is a mistake.":
    "不允许此次注册。请使用其他登录方式；如有异议，请联系支持团队。",
  "That sign-in didn't finish. Try again, or use another sign-in method.":
    "登录未完成。请重试或使用其他登录方式。",
  "This account has been banned. If you think this is a mistake, please contact support.":
    "此账户已被封禁。如有异议，请联系支持团队。",
};

export function useAuthPageTranslation() {
  const { t } = useTranslation();

  function translateMessage(message: string) {
    return Object.hasOwn(COPY, message) ? t(message, COPY[message]) : message;
  }

  return { translateMessage };
}
