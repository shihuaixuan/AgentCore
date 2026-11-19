import type { Locale } from "@/lib/i18n/locale";
import { RUN_DELAY_MS } from "./constants";
import type { TourScript } from "./types";

export function getCompetitorWatchScript(locale: Locale = "en"): TourScript {
  const isChinese = locale === "zh-CN";

  return [
    {
      assistantMessageId: "competitor-asst-1",
      userPrompt: isChinese
        ? "监测竞争对手的定价页面，价格变化时给我发邮件"
        : "Watch a competitor's pricing page and email me when the price changes",
      steps: [
        {
          delayMs: 400,
          part: {
            type: "text",
            text: isChinese
              ? "目标很明确！让我把它拆分为几个步骤。"
              : "Great goal! Let me break that down into steps.",
          },
        },
        {
          delayMs: 700,
          part: {
            type: "plan",
            plan: {
              goal: isChinese
                ? "监测竞品定价页面，在变化时发送邮件"
                : "Watch a competitor's pricing page and email me on change",
              steps: [
                {
                  description: isChinese
                    ? "定时获取竞品定价页面"
                    : "Fetch the competitor pricing page on a schedule",
                  blockName: "Send Web Request",
                },
                {
                  description: isChinese
                    ? "与上次快照对比，检测变化"
                    : "Detect changes vs. the last snapshot",
                  blockName: "Text Compare",
                },
                {
                  description: isChinese
                    ? "发生变化时，通过邮件发送摘要"
                    : "Email me a summary when it changes",
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
      assistantMessageId: "competitor-asst-2",
      userPrompt: isChinese
        ? "好的，帮我构建并运行"
        : "Yes, build and run it for me",
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
              name: isChinese ? "竞品价格监测" : "Competitor Pricing Watcher",
              schedule: isChinese ? "每天 · 上午 8:00" : "Daily · 8:00 AM",
              blocks: ["Send Web Request", "Text Compare", "Send Email"],
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
                ? "检测到价格变化 — 竞品 Pro 方案"
                : "Price change detected — Competitor Pro plan",
              subtitle: isChinese
                ? "上午 8:02，competitor.com/pricing 上的 Pro 方案发生变化："
                : "Pro tier changed on competitor.com/pricing at 8:02 AM:",
              diff: {
                from: isChinese ? "$49/月" : "$49/mo",
                to: isChinese ? "$59/月" : "$59/mo",
                delta: "+20.4%",
              },
            },
          },
        },
        {
          delayMs: 600,
          part: {
            type: "text",
            text: isChinese
              ? "你的工作流已启用 — 价格再次变化时，就会立即发邮件通知你。🎉"
              : "Your workflow is live — it'll email you the moment that price moves again. 🎉",
          },
        },
      ],
    },
  ];
}

export const competitorWatchScript = getCompetitorWatchScript();
