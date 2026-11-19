import { toast } from "@/components/molecules/Toast/use-toast";
import type { Locale } from "@/lib/i18n/locale";

import {
  describeProviderFailure,
  parseProviderFailure,
  type ProviderFailure,
} from "./providerFailure";

/**
 * Parses a backend-encoded error code from an `errorText` payload.
 *
 * The AI-SDK SSE protocol enforces `z.strictObject({type, errorText})`
 * on StreamError frames, so the backend cannot attach a top-level `code`
 * field. Instead it prefixes the message with `[code:<id>] <msg>` and
 * this helper extracts it client-side.
 */
export function parseBackendErrorCode(raw: string): {
  code: string | null;
  message: string;
} {
  const match = raw.match(/^\s*\[code:([a-z0-9_]+)\]\s*(.*)$/is);
  if (!match) return { code: null, message: raw };
  return { code: match[1], message: match[2].trim() };
}

/**
 * User-facing toast copy for each backend error code we surface.
 * `description` defaults to the backend's error message when provided;
 * `fallbackDescription` is used when the backend sends only the code.
 */
function toastByBackendCode(
  t: (english: string, chinese: string) => string,
): Record<string, { title: string; fallbackDescription: string }> {
  return {
    idle_timeout: {
      title: t("Your expert stopped responding", "你的专家停止响应"),
      fallbackDescription: t(
        "A tool call got stuck and the session timed out. Press Try Again to resume.",
        "工具调用卡住，导致会话超时。请点击“重试”以恢复。",
      ),
    },
    tool_stalled: {
      title: t("A tool call is taking too long", "工具调用耗时过长"),
      fallbackDescription: t(
        "The assistant is waiting on a tool that hasn't responded. Press Try Again to restart.",
        "助手正在等待尚未响应的工具。请点击“重试”以重新开始。",
      ),
    },
    transient_api_error: {
      title: t("Connection hiccup", "连接暂时异常"),
      fallbackDescription: t(
        "We hit a temporary error talking to the model. Press Try Again to continue.",
        "与模型通信时出现临时错误。请点击“重试”以继续。",
      ),
    },
    circuit_breaker_empty_tool_calls: {
      title: t("Your expert paused", "你的专家已暂停"),
      fallbackDescription: t(
        "The assistant made too many empty tool calls in a row and was paused. Press Try Again to continue.",
        "助手因连续多次发出空工具调用而被暂停。请点击“重试”以继续。",
      ),
    },
    all_attempts_exhausted: {
      title: t("Conversation too long", "对话过长"),
      fallbackDescription: t(
        "We couldn't fit this chat's history into the model after several attempts. Start a new chat or clear some history.",
        "多次尝试后，此对话的历史仍超出模型容量。请开始新对话或清理部分历史记录。",
      ),
    },
    sdk_stream_error: {
      title: t("Your expert ran into an error", "你的专家遇到了错误"),
      fallbackDescription: t(
        "Something went wrong while the assistant was responding. Press Try Again to retry.",
        "助手回复时出现错误。请点击“重试”。",
      ),
    },
    sdk_error: {
      title: t("Your expert ran into an error", "你的专家遇到了错误"),
      fallbackDescription: t(
        "The assistant couldn't complete this turn. Press Try Again to retry.",
        "助手未能完成本轮回复。请点击“重试”。",
      ),
    },
    provider_unavailable: {
      title: t("Your expert is temporarily unavailable", "你的专家暂时不可用"),
      fallbackDescription: t(
        "The AI model provider is temporarily unavailable. We've been alerted and are working on it. Please try again shortly.",
        "AI 模型服务商暂时不可用。我们已收到通知并正在处理，请稍后重试。",
      ),
    },
    sandbox_limit_reached: {
      title: t("Couldn't start a sandbox", "无法启动沙盒"),
      fallbackDescription: t(
        "Wait for one of your tasks to finish, then try again.",
        "请等待一个任务完成后再重试。",
      ),
    },
    max_budget_exhausted: {
      title: t("Turn budget reached", "本轮开销已达上限"),
      fallbackDescription: t(
        "This turn reached its spending limit. Send a follow-up to continue with a smaller scope. If your account usage limit is also reached, wait for it to reset.",
        "本轮已达到开销上限。请发送后续消息，以更小范围继续。如果账户使用额度也已耗尽，请等待额度重置。",
      ),
    },
  };
}

/** Fallback toast shown for any `[code:X]` we don't have specific copy for. */
/**
 * Extract the human-readable error detail. FastAPI typically wraps 4xx
 * responses in `{"detail": "..."}` — if the SDK surfaced that as JSON in
 * `error.message`, unwrap to the nested string; otherwise use the raw message.
 */
function extractErrorDetail(error: Error): string {
  try {
    const parsed = JSON.parse(error.message) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "detail" in parsed &&
      typeof (parsed as { detail: unknown }).detail === "string"
    ) {
      return (parsed as { detail: string }).detail;
    }
  } catch {
    // Not JSON — use message as-is
  }
  return error.message;
}

/**
 * A typed provider-failure envelope, when FastAPI's `{"detail": ...}` wraps
 * an object instead of a string (e.g. the 429 raised for the platform usage
 * cap). `extractErrorDetail` above only unwraps string details, so a
 * structured refusal used to fall through to substring guessing and never
 * reached the "switch connection" UI. Checked separately so the string path
 * stays untouched for every other error shape.
 */
function extractProviderFailureDetail(error: Error): ProviderFailure | null {
  try {
    const parsed = JSON.parse(error.message) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "detail" in parsed &&
      typeof (parsed as { detail: unknown }).detail === "object" &&
      (parsed as { detail: unknown }).detail !== null
    ) {
      return parseProviderFailure((parsed as { detail: unknown }).detail);
    }
  } catch {
    // Not JSON
  }
  return null;
}

/**
 * Where a usage limit was refused. The two limits do not share an answer:
 *
 * - `"admission"`: the backend refused the turn before the stream opened,
 *   which only our own budget does. The envelope came in the HTTP error body.
 * - `"provider"`: the connection the turn ran on refused it mid-turn. The
 *   envelope rode the live stream.
 *
 * Told apart by origin rather than by `authProvider` because a self-host
 * runs its own OpenRouter or local gateway on the "platform" route, so its
 * upstream 429 carries the same `authProvider` as our admission cap.
 */
export type UsageLimitOrigin = "admission" | "provider";

interface HandleStreamErrorArgs {
  error: Error;
  locale?: Locale;
  onRateLimit: (
    message: string,
    providerFailure?: ProviderFailure,
    origin?: UsageLimitOrigin,
  ) => void;
  onReconnect: () => void;
  /**
   * The account has no plan (HTTP 402). The backend refuses before saving the
   * prompt, so the caller puts it back in the composer; the chat's error
   * banner is the one message and carries the upgrade path, so no toast.
   */
  onPaywall?: () => void;
  isUserStoppingRef: React.MutableRefObject<boolean>;
  /**
   * The typed envelope, when this turn sent one. It is the only source here
   * that actually knows what happened; every branch below it is inference
   * from error text.
   */
  providerFailure?: ProviderFailure | null;
}

/**
 * Process a stream error from `useChat.onError`. Surfaces the right toast
 * (or rate-limit UI), and decides whether to retry via reconnect.
 *
 * Dispatch order (exclusive branches):
 *  -. HTTP 402 (no plan) → `onPaywall`; the error banner says the rest.
 *  0. A typed provider-failure envelope → its own copy.
 *  1. `[code:<id>]` backend prefix → curated or generic backend toast.
 *  2. Legacy `usage limit` substring → rate-limit UI via `onRateLimit`.
 *  3. Legacy 401 / auth failure → auth-error toast.
 *  4. TypeError / AbortError / "connection interrupted" → reconnect.
 *  5. Anything else silently falls through (the AI-SDK also surfaces
 *     `error` into the hook's `error` return, which drives the inline
 *     error banner).
 */
export function handleStreamError({
  error,
  onRateLimit,
  onReconnect,
  onPaywall,
  isUserStoppingRef,
  providerFailure: streamedProviderFailure,
  locale = "en",
}: HandleStreamErrorArgs): void {
  function t(english: string, chinese: string) {
    return locale === "zh-CN" ? chinese : english;
  }
  if ((error as { status?: unknown }).status === 402) {
    onPaywall?.();
    return;
  }
  const errorDetail = extractErrorDetail(error);
  // The live stream's typed envelope wins when present; otherwise recover
  // one from a structured 429/etc. body raised before streaming started.
  const providerFailure =
    streamedProviderFailure ?? extractProviderFailureDetail(error);

  // 0. The server said what went wrong, so stop guessing.
  if (providerFailure) {
    const copy = describeProviderFailure(providerFailure, locale);
    if (providerFailure.kind === "usage_limit") {
      // Still routed through the rate-limit path: it restores the composer
      // text for a message the backend refused before persisting, which a
      // toast alone would lose.
      //
      // The failure travels with it, and so does where it was refused, so
      // the caller can tell the two limits apart. They are not the same
      // event: our own credits running out is answered by upgrading a plan
      // with us, and a linked subscription running out is answered by
      // continuing on a different connection. Offering the first for the
      // second asks someone to pay us because OpenAI said no.
      const origin: UsageLimitOrigin = streamedProviderFailure
        ? "provider"
        : "admission";
      onRateLimit(
        `${copy.title}. ${copy.description}`,
        providerFailure,
        origin,
      );
      return;
    }
    toast({
      title: copy.title,
      description: copy.description,
      variant: "destructive",
    });
    return;
  }

  // 1. Coded backend errors take precedence over message-text heuristics.
  const { code: backendCode, message: backendMessage } =
    parseBackendErrorCode(errorDetail);
  if (backendCode) {
    const userToast = toastByBackendCode(t)[backendCode] ?? {
      title: t("Your expert ran into a problem", "你的专家遇到了问题"),
      fallbackDescription: t(
        "The assistant stopped unexpectedly. Press Try Again to retry.",
        "助手意外停止。请点击“重试”。",
      ),
    };
    toast({
      title: userToast.title,
      description: backendMessage || userToast.fallbackDescription,
      variant: "destructive",
    });
    return;
  }

  // 2. Rate limit (FastAPI 429 body contains "usage limit")
  if (errorDetail.toLowerCase().includes("usage limit")) {
    onRateLimit(
      errorDetail ||
        t(
          "You've reached your usage limit. Please try again later.",
          "你已达到使用上限，请稍后重试。",
        ),
    );
    return;
  }

  // 3. Authentication failures (from getCopilotAuthHeaders or 401 responses)
  const isAuthError =
    errorDetail.includes("Authentication failed") ||
    errorDetail.includes("Unauthorized") ||
    errorDetail.includes("Not authenticated") ||
    errorDetail.toLowerCase().includes("401");
  if (isAuthError) {
    toast({
      title: t("Authentication error", "身份验证失败"),
      description: t(
        "Your session may have expired. Please sign in again.",
        "你的会话可能已过期，请重新登录。",
      ),
      variant: "destructive",
    });
    return;
  }

  // 4. Transient network / abort — reconnect so the "Try Again" affordance
  // (persisted retryable-error marker on the session) lights up.
  if (isUserStoppingRef.current) return;
  const isNetworkError =
    error.name === "TypeError" || error.name === "AbortError";
  const isTransientApiError = errorDetail.includes("connection interrupted");
  if (isNetworkError || isTransientApiError) {
    onReconnect();
  }
}
