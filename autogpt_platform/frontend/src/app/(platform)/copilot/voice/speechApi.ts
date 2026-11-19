import { environment } from "@/services/environment";
import type { Locale } from "@/lib/i18n/locale";

import { CopilotAuthError, getCopilotAuthHeaders } from "../helpers";

export async function synthesizeSpeech(
  text: string,
  sessionId: string | null,
  locale: Locale = "en",
): Promise<Blob> {
  const authHeaders = await getCopilotAuthHeaders().catch((error: unknown) => {
    if (error instanceof CopilotAuthError && locale === "zh-CN") {
      error.message = "身份验证失败，请重新登录。";
    }
    throw error;
  });
  const response = await fetch(
    `${environment.getAGPTServerBaseUrl()}/api/chat/speech`,
    {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, session_id: sessionId }),
    },
  );

  if (!response.ok) {
    throw new Error(speechFailure(response.status, locale));
  }

  return response.blob();
}

export async function transcribeUtterance(
  audio: Blob,
  locale: Locale = "en",
): Promise<string> {
  const body = new FormData();
  body.append("audio", audio);

  const response = await fetch("/api/transcribe", { method: "POST", body });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error || (locale === "zh-CN" ? "转写失败" : "Transcription failed"),
    );
  }

  const data = await response.json();
  return typeof data.text === "string" ? data.text : "";
}

/**
 * The spend pre-flight refuses before it synthesises, so these are the
 * statuses a user actually meets. A bare code tells them nothing about what
 * to do next.
 */
function speechFailure(status: number, locale: Locale): string {
  if (status === 429) {
    return locale === "zh-CN"
      ? "你已达到使用上限，语音回复将暂停至额度重置。"
      : "You've reached your usage limit — voice replies are paused until it resets.";
  }
  if (status === 402) {
    return locale === "zh-CN"
      ? "语音回复需要有效的 AutoGPT 订阅。"
      : "Voice replies need an active AutoGPT subscription.";
  }
  if (status === 503) {
    return locale === "zh-CN"
      ? "语音回复暂不可用。请稍后重试。"
      : "Voice replies are unavailable right now. Try again shortly.";
  }
  return locale === "zh-CN"
    ? `语音合成失败（${status}）`
    : `Speech synthesis failed (${status})`;
}
