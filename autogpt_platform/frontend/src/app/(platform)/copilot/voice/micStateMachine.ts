/**
 * The voice-mode loop as a pure reducer.
 *
 * The mic is open in exactly two states, and never while Otto speaks —
 * that is what removes echo without acoustic cancellation, and it is the
 * invariant the rest of the feature leans on.
 */

import type { Locale } from "@/lib/i18n/locale";

export type VoiceState =
  | "off"
  | "listening"
  | "hearing"
  | "transcribing"
  | "thinking"
  | "speaking";

export type VoiceEvent =
  | { type: "ENABLE" }
  | { type: "DISABLE" }
  | { type: "SPEECH_START" }
  | { type: "SPEECH_END" }
  /** VAD fired but the utterance was too short to be speech. */
  | { type: "SPEECH_MISFIRE" }
  | { type: "TRANSCRIPT_SENT" }
  /** Transcript was empty, filler, or the send failed. */
  | { type: "TRANSCRIPT_DROPPED" }
  /** The user asked for a failed transcription to be tried again. */
  | { type: "RETRY" }
  | { type: "REPLY_SPEAKING" }
  /** The reply finished with nothing left to say. */
  | { type: "REPLY_DONE" }
  | { type: "ERROR" };

export function voiceReduce(state: VoiceState, event: VoiceEvent): VoiceState {
  if (event.type === "DISABLE") return "off";
  if (state === "off") return event.type === "ENABLE" ? "listening" : "off";

  switch (event.type) {
    case "SPEECH_START":
      return state === "listening" ? "hearing" : state;
    case "SPEECH_END":
      return state === "hearing" ? "transcribing" : state;
    case "SPEECH_MISFIRE":
      return state === "hearing" ? "listening" : state;
    case "TRANSCRIPT_SENT":
      return state === "transcribing" ? "thinking" : state;
    case "TRANSCRIPT_DROPPED":
      return state === "transcribing" ? "listening" : state;
    // Only from an open, quiet mic: mid-utterance the retry would race the
    // user's new speech for the same turn.
    case "RETRY":
      return state === "listening" ? "transcribing" : state;
    case "REPLY_SPEAKING":
      return state === "thinking" || state === "speaking" ? "speaking" : state;
    case "REPLY_DONE":
      return state === "thinking" || state === "speaking" ? "listening" : state;
    case "ERROR":
      return "listening";
    default:
      return state;
  }
}

export function isMicOpen(state: VoiceState): boolean {
  return state === "listening" || state === "hearing";
}

export function describeVoiceState(
  state: VoiceState,
  locale: Locale = "en",
): string {
  switch (state) {
    case "listening":
      return locale === "zh-CN" ? "正在聆听" : "Listening";
    case "hearing":
      return locale === "zh-CN" ? "正在聆听" : "Listening";
    case "transcribing":
      return locale === "zh-CN" ? "正在转写" : "Transcribing";
    case "thinking":
      return locale === "zh-CN" ? "正在思考" : "Thinking";
    case "speaking":
      return locale === "zh-CN" ? "正在朗读" : "Speaking";
    case "off":
      return locale === "zh-CN" ? "语音模式已关闭" : "Voice mode off";
  }
}
