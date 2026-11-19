import type { AtResetTurn } from "@/app/api/__generated__/models/atResetTurn";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import type { Locale } from "@/lib/i18n/locale";
import {
  formatResetClock,
  formatWeekday,
} from "@/services/usageExperience/budget";

export const SEND_AT_RESET_LABEL = "Send at reset";
export const SCHEDULE_FAILED_TITLE = "Couldn’t schedule your message";
export const SEND_AT_RESET_PLACEHOLDER =
  "Write now, and it sends when your budget resets…";
/** How long after a page sends a message to be set the request may still
 *  land: the server can take seconds over it, and keeps going after a reload
 *  drops the page. */
export const SEND_SETTLE_MS = 15_000;

/** Thrown when the budget turned out to be back, so the message went out
 *  straight away instead, and that send failed; `cause` is how it failed. */
export class SentNowError extends Error {
  constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : "", { cause });
    this.name = "SentNowError";
  }
}

/** What the toast calls a failed Send at reset: a send, if it went out now. */
export function sendAtResetFailureTitle(
  error: unknown,
  locale: Locale = "en",
): string {
  if (locale === "zh-CN")
    return error instanceof SentNowError ? "无法发送消息" : "无法安排消息发送";
  return error instanceof SentNowError
    ? "Couldn't send message"
    : SCHEDULE_FAILED_TITLE;
}

/** The input id of an open chat's composer. */
export const SESSION_COMPOSER_ID = "chat-input-session";

export function sessionDraftKey(sessionId: string) {
  return `session:${sessionId}`;
}

/** Why the server would not set a send for the reset: the budget is already
 *  back, or it never refills on its own. Null for any other failure. */
export function atResetRefusal(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const detail: unknown = error.response?.detail;
  return detail === "not_out_of_budget" || detail === "no_reset"
    ? detail
    : null;
}

/** The server joins a send onto the one already waiting, and refuses when the
 *  two together would be longer than one message may be. */
export function isJoinedSendTooLong(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 413 &&
    error.response?.detail === "message_too_long"
  );
}

export function scheduledSendLabel(
  runAt: Date | string,
  now = new Date(),
  locale: Locale = "en",
) {
  const date = new Date(runAt);
  if (locale === "zh-CN") {
    const clock = date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return date.toDateString() === now.toDateString()
      ? `${clock} 发送`
      : `${date.toLocaleDateString(locale, { weekday: "long" })} ${clock} 发送`;
  }
  const clock = formatResetClock(date);
  return date.toDateString() === now.toDateString()
    ? `Sends at ${clock}`
    : `Sends ${formatWeekday(date)} at ${clock}`;
}

/** Puts a message back in front of whatever the composer holds now, keeping
 *  both: a draft written meanwhile must never be lost to it. */
export function returnToDraft(current: string, message: string) {
  if (!current.trim() || current === message) return message;
  return `${message}\n\n${current}`;
}

/** Whether the send waiting holds `message`: the server joins each send set
 *  while one waits onto it, after a blank line. */
export function holdsMessage(waiting: string, message: string) {
  return (
    waiting === message ||
    waiting.startsWith(`${message}\n\n`) ||
    waiting.endsWith(`\n\n${message}`) ||
    waiting.includes(`\n\n${message}\n\n`)
  );
}

/** Whether a read of the chat's send found `message` in it. */
export function readHolds(
  read: { send: AtResetTurn | null } | { error: unknown },
  message: string,
) {
  return "send" in read && holdsMessage(read.send?.message ?? "", message);
}
