import type { Locale } from "@/lib/i18n/locale";
import { RUN_DELAY_MS } from "./constants";
import type { TourScript } from "./types";

export function getDailyBriefScript(locale: Locale = "en"): TourScript {
  const isChinese = locale === "zh-CN";

  return [
    {
      assistantMessageId: "brief-asst-1",
      userPrompt: isChinese
        ? "每天早上，把我的未读邮件和日程汇总成一份简报"
        : "Every morning, pull my unread emails and calendar into one brief",
      steps: [
        {
          delayMs: 400,
          part: {
            type: "text",
            text: isChinese
              ? "好主意。我会这样设置。"
              : "Love it. Here's how I'll set that up.",
          },
        },
        {
          delayMs: 700,
          part: {
            type: "plan",
            plan: {
              goal: isChinese
                ? "每天早上发送一份汇总邮件和日程的简报"
                : "Send me one morning brief with my email and calendar",
              steps: [
                {
                  description: isChinese
                    ? "读取未读邮件和今天的日程"
                    : "Read unread emails and today's calendar",
                  blockName: "Gmail Read",
                },
                {
                  description: isChinese
                    ? "将所有内容汇总成一份简报"
                    : "Summarize everything into a short brief",
                  blockName: "AI Text Generator",
                },
                {
                  description: isChinese
                    ? "每天早上 7:30 发送"
                    : "Deliver it every morning at 7:30",
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
      assistantMessageId: "brief-asst-2",
      userPrompt: isChinese ? "很好，帮我设置吧" : "Perfect, set it up",
      steps: [
        {
          delayMs: 500,
          part: {
            type: "text",
            text: isChinese
              ? "正在构建你的工作流 — 选择模块、连接流程、设置运行计划。"
              : "Building your workflow — picking blocks, wiring them up, setting the schedule.",
          },
        },
        {
          delayMs: 900,
          part: {
            type: "agent",
            agent: {
              name: isChinese ? "晨间简报" : "Morning Brief",
              schedule: isChinese ? "每天 · 上午 7:30" : "Daily · 7:30 AM",
              blocks: ["Gmail Read", "AI Text Generator", "Send Email"],
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
                ? "今日简报 — 7 月 2 日，周四"
                : "Your brief — Thu, Jul 2",
              bullets: [
                isChinese
                  ? "上午 9:30 路线图评审 — 演示文稿尚未共享"
                  : "9:30 AM roadmap review — deck still unshared",
                isChinese
                  ? "Acme Corp 发来 3 封未读邮件，附有合同修订稿"
                  : "3 unread from Acme Corp, contract redlines attached",
                isChinese
                  ? "待回复：Jordan 关于第三季度定价方案的邮件"
                  : "Reply owed: Jordan on the Q3 pricing proposal",
              ],
            },
          },
        },
        {
          delayMs: 600,
          part: {
            type: "text",
            text: isChinese
              ? "设置好了 — 每天早上 7:30，这样的简报都会送到你的收件箱。🎉"
              : "All set — a brief like this will be waiting in your inbox at 7:30 every morning. 🎉",
          },
        },
      ],
    },
  ];
}

export const dailyBriefScript = getDailyBriefScript();
