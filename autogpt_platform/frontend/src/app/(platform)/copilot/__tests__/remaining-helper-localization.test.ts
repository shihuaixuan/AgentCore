import { expect, test } from "vitest";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import {
  scheduledSendLabel,
  sendAtResetFailureTitle,
  SentNowError,
} from "../components/SendAtReset/helpers";
import {
  changeErrorText,
  refusalText,
} from "../components/ScheduledChatNoticeCard/components/RunLessOftenDialog/helpers";
import {
  pauseBody,
  pauseTitle,
  resetAt,
  resetIn,
  resumeLabel,
} from "../components/TurnPausedCard/helpers";
import {
  atResetOutcome,
  continueOutcome,
} from "../components/TurnPausedCard/components/LivePausedCard/helpers";
import type { TurnPause } from "../turnPause";

test("localizes scheduled send time and errors with English defaults", () => {
  const now = new Date(2026, 10, 18, 9, 0);
  const later = new Date(2026, 10, 18, 14, 30);
  expect(scheduledSendLabel(later, now, "zh-CN")).toContain("14:30 发送");
  expect(scheduledSendLabel(later, now)).toMatch(/^Sends at /);
  expect(sendAtResetFailureTitle(null, "zh-CN")).toBe("无法安排消息发送");
  expect(sendAtResetFailureTitle(new SentNowError(null), "zh-CN")).toBe(
    "无法发送消息",
  );
});

test("localizes schedule refusals without changing error classification", () => {
  expect(refusalText(new ApiError("Raw API error", 409, {}), "zh-CN")).toBe(
    "已暂停。请先恢复运行。",
  );
  expect(changeErrorText(new ApiError("Raw API error", 400, {}), "zh-CN")).toBe(
    "请选择显示的一个选项。",
  );
  expect(refusalText(new Error("Raw error"), "zh-CN")).toBeNull();
  expect(refusalText(new ApiError("Raw API error", 409, {}))).toBe(
    "It's paused. Resume it first.",
  );
});

test("localizes pause resume times and retains English fallback", () => {
  const now = new Date(2026, 10, 18, 9, 0);
  const later = new Date(2026, 10, 18, 14, 30);
  expect(resetAt(later, now, "zh-CN")).toBe("14:30");
  expect(resumeLabel(later.toISOString(), now, "zh-CN")).toBe("14:30 恢复");
  expect(resumeLabel(null, now, "zh-CN")).toBe("额度重置后恢复");
  expect(resumeLabel(null, now)).toBe("Resume at reset");
});

test("localizes budget pause explanations and countdowns without changing assistant names", () => {
  const now = new Date(2026, 10, 18, 9, 0);
  const later = new Date(2026, 10, 18, 14, 30);
  const pause: TurnPause = {
    reason: "daily",
    resets_at: later.toISOString(),
    steps: null,
    checkpoint_saved: true,
    started: true,
  };
  expect(pauseTitle(pause, "zh-CN")).toBe("已暂停 · 今日额度已用尽");
  expect(
    pauseBody({ pause, name: "Original Expert", now, locale: "zh-CN" }),
  ).toBe(
    "Original Expert 已在上方保存进度。你的额度将于 14:30 重置（5 小时 30 分钟后）。",
  );
  expect(resetIn(later, now, "zh-CN")).toBe("5 小时 30 分钟后");
  expect(pauseTitle(pause)).toBe("Paused · out of today's budget");
  expect(
    pauseBody({
      pause: { ...pause, reason: "steps", steps: 1200 },
      name: "Original Expert",
      now,
      locale: "zh-CN",
    }),
  ).toBe("Original Expert 已为此执行 1,200 个步骤，并在上方总结了进度。");
});

test("localizes resume recovery and preserves raw provider failures", () => {
  expect(
    atResetOutcome(
      new ApiError("Raw error", 409, { detail: "no_reset" }),
      "zh-CN",
    ),
  ).toEqual({
    kind: "failed",
    title: "此额度不会自动重置",
    description: "升级套餐以继续。",
  });
  expect(continueOutcome(new ApiError("Raw error", 402, {}), "zh-CN")).toEqual({
    kind: "failed",
    description: "请选择套餐以继续。",
  });
  expect(
    continueOutcome(
      new ApiError("Raw error", 429, { detail: "Raw provider limit" }),
      "zh-CN",
    ),
  ).toEqual({ kind: "failed", description: "Raw provider limit" });
});
