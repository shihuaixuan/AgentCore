import type { Locale } from "@/lib/i18n/locale";
import { RUN_DELAY_MS } from "./constants";
import type { TourScript } from "./types";

export function getCallPrepScript(locale: Locale = "en"): TourScript {
  const isChinese = locale === "zh-CN";

  return [
    {
      assistantMessageId: "callprep-asst-1",
      userPrompt: isChinese
        ? "每次销售通话前，向我简要介绍对方的公司和参会人"
        : "Brief me on the company and person before every sales call",
      steps: [
        {
          delayMs: 400,
          part: {
            type: "text",
            text: isChinese
              ? "这个场景很实用。我会这样设置。"
              : "Great use case. Here's how I'll set that up.",
          },
        },
        {
          delayMs: 700,
          part: {
            type: "plan",
            plan: {
              goal: isChinese
                ? "为日程中的每次外部通话做好准备"
                : "Prep me before each external call on my calendar",
              steps: [
                {
                  description: isChinese
                    ? "识别日程中即将开始的外部通话"
                    : "Spot upcoming external calls on my calendar",
                  blockName: "Google Calendar",
                },
                {
                  description: isChinese
                    ? "调研对方公司和参会人"
                    : "Research the company and attendees",
                  blockName: "Web Search",
                },
                {
                  description: isChinese
                    ? "提前 30 分钟发送一页简报"
                    : "Send a one-page brief 30 minutes before",
                  blockName: "Send Email",
                },
              ],
            },
          },
        },
        {
          delayMs: 500,
          part: {
            type: "text",
            text: isChinese
              ? "要我现在就构建并运行吗？"
              : "Want me to build and run it right now?",
          },
        },
      ],
    },
    {
      assistantMessageId: "callprep-asst-2",
      userPrompt: isChinese
        ? "听起来不错，帮我设置吧"
        : "Sounds great, set it up",
      steps: [
        {
          delayMs: 500,
          part: {
            type: "text",
            text: isChinese
              ? "正在构建你的工作流 — 选择模块、连接流程、设置触发条件。"
              : "Building your workflow — picking blocks, wiring them up, setting the trigger.",
          },
        },
        {
          delayMs: 900,
          part: {
            type: "agent",
            agent: {
              name: isChinese ? "通话准备简报" : "Call Prep Briefer",
              schedule: isChinese
                ? "每次通话前 30 分钟"
                : "30 min before each call",
              blocks: ["Google Calendar", "Web Search", "Send Email"],
            },
          },
        },
        {
          delayMs: RUN_DELAY_MS,
          part: {
            type: "text",
            text: isChinese
              ? "完成了 — 首次运行刚刚结束，以下是生成的结果："
              : "Done — first run just finished. Here's what it produced:",
          },
        },
        {
          delayMs: 700,
          part: {
            type: "artifact",
            artifact: {
              caption: isChinese
                ? "发送到你收件箱的内容"
                : "what lands in your inbox",
              title: isChinese
                ? "通话准备 — Acme Corp · 下午 2:00"
                : "Call prep — Acme Corp · 2:00 PM",
              bullets: [
                isChinese
                  ? "B 轮融资，约 140 人 — 3 月融资 3,000 万美元"
                  : "Series B, ~140 people — raised $30M in March",
                isChinese
                  ? "会面对象是运营副总裁 Dana Patel — 第二次通话"
                  : "You're meeting Dana Patel, VP Ops — second call",
                isChinese
                  ? "待跟进：对按席位计费模式的价格异议"
                  : "Open thread: pricing objection on the per-seat model",
              ],
            },
          },
        },
        {
          delayMs: 600,
          part: {
            type: "text",
            text: isChinese
              ? "完成了 — 日程中的每次通话前，你都会收到这样的简报。🎉"
              : "Done — you'll get a brief like this before every call on your calendar. 🎉",
          },
        },
      ],
    },
  ];
}

export const callPrepScript = getCallPrepScript();
