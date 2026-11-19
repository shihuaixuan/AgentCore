import { CopilotAuthError } from "./helpers";
import type { Locale } from "@/lib/i18n/locale";
import {
  ChatUnavailableError,
  isUnexpectedRefusal,
  MessageTooLongError,
} from "./stream/turnRuntime";

export type ChatErrorAction = "sign-in" | "new-chat" | "plans";

export interface ChatErrorGuidance {
  /** What happened, and what will work next. */
  title: string;
  action: ChatErrorAction | null;
  /** A small muted line under the guidance. */
  note?: string;
}

/** Guidance for a failed send or stream; it promises a resend only where one can succeed. */
export function describeChatError(
  error: Error,
  locale: Locale = "en",
): ChatErrorGuidance {
  function t(english: string, chinese: string) {
    return locale === "zh-CN" ? chinese : english;
  }
  const status = statusOf(error);
  if (
    error instanceof CopilotAuthError ||
    status === 401 ||
    /authentication failed|not authenticated/i.test(error.message)
  )
    return {
      title: t(
        "You're signed out. Sign in again to keep chatting.",
        "你已退出登录。请重新登录以继续对话。",
      ),
      action: "sign-in",
    };
  if (error instanceof ChatUnavailableError || status === 404)
    return {
      title: t(
        "This chat no longer exists. Start a new chat to keep going.",
        "此对话已不存在。请开始新对话以继续。",
      ),
      action: "new-chat",
    };
  if (error instanceof MessageTooLongError)
    return {
      title: t(
        "Your message is too long. Shorten it and send again.",
        "你的消息过长。请缩短后再次发送。",
      ),
      action: null,
    };
  if (/prompt is too long/i.test(error.message))
    return {
      title: t(
        "This conversation is too long to continue. Start a new chat to keep going.",
        "此对话过长，无法继续。请开始新对话。",
      ),
      action: "new-chat",
    };
  if (status === 402)
    return {
      title: t(
        "Sending needs an active plan, so this message wasn't sent.",
        "发送消息需要有效套餐，因此此消息未发送。",
      ),
      action: "plans",
    };
  if (status === 429 || /usage limit/i.test(error.message))
    return {
      title: t(
        "You've reached a usage limit, so this message wasn't sent.",
        "你已达到使用上限，因此此消息未发送。",
      ),
      action: null,
    };
  // The app only sends what the server accepts, so this is our bug.
  if (status !== null && isUnexpectedRefusal(status))
    return {
      title: t(
        "The request was refused. Reload the page and try again; if it keeps happening, contact support.",
        "请求被拒绝。请刷新页面后重试；如果问题持续，请联系支持人员。",
      ),
      action: null,
      note: t(
        "The system maintainer has been notified of the issue",
        "已通知系统维护人员处理此问题",
      ),
    };
  if (status !== null && status >= 500)
    return {
      title: t(
        "The server had a problem. Please try sending your message again in a moment.",
        "服务器出现问题。请稍后重新发送消息。",
      ),
      action: null,
    };
  if (error.name === "TypeError")
    return {
      title: t(
        "The connection dropped before your message was sent. Check your connection and send it again.",
        "消息发出前连接已断开。请检查网络后重新发送。",
      ),
      action: null,
    };
  return {
    title: t(
      "Something went wrong. Please try sending your message again.",
      "发生了错误。请重新发送消息。",
    ),
    action: null,
  };
}

function statusOf(error: Error) {
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}
