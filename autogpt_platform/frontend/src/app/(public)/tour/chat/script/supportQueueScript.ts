import type { Locale } from "@/lib/i18n/locale";
import { RUN_DELAY_MS } from "./constants";
import type { TourScript } from "./types";

export function getSupportQueueScript(locale: Locale = "en"): TourScript {
  const isChinese = locale === "zh-CN";

  return [
    {
      assistantMessageId: "support-asst-1",
      userPrompt: isChinese
        ? "对新客服工单分类，并为常见问题起草回复"
        : "Triage new support tickets and draft replies for the common ones",
      steps: [
        {
          delayMs: 400,
          part: {
            type: "text",
            text: isChinese
              ? "交给我。我会这样帮你管理工单。"
              : "On it. Here's how I'll keep your queue under control.",
          },
        },
        {
          delayMs: 700,
          part: {
            type: "plan",
            plan: {
              goal: isChinese
                ? "对客服工单分类，并起草常见问题的回复"
                : "Triage the support queue and draft the easy replies",
              steps: [
                {
                  description: isChinese
                    ? "从客服收件箱获取新工单"
                    : "Pull new tickets from the support inbox",
                  blockName: "Gmail Read",
                },
                {
                  description: isChinese
                    ? "判断紧急程度并起草回复"
                    : "Classify urgency and draft a reply",
                  blockName: "AI Text Generator",
                },
                {
                  description: isChinese
                    ? "将紧急工单升级给团队处理"
                    : "Escalate urgent tickets to the team",
                  blockName: "Send Slack Message",
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
      assistantMessageId: "support-asst-2",
      userPrompt: isChinese ? "开始吧，帮我设置" : "Go ahead, set it up",
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
              name: isChinese ? "客服工单分类" : "Support Queue Triage",
              schedule: isChinese ? "每 15 分钟" : "Every 15 minutes",
              blocks: ["Gmail Read", "AI Text Generator", "Send Slack Message"],
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
              caption: isChinese ? "团队看到的内容" : "what your team sees",
              title: isChinese
                ? "工单已分类 — 14 张新工单"
                : "Queue triaged — 14 new tickets",
              bullets: [
                isChinese
                  ? "已起草 9 条回复，等待你审核"
                  : "9 replies drafted and ready for your review",
                isChinese
                  ? "3 个账单问题已转交 Sam"
                  : "3 billing questions routed to Sam",
                isChinese
                  ? "2 条紧急欧洲服务中断报告已升级到 #support"
                  : "2 urgent EU outage reports escalated to #support",
              ],
            },
          },
        },
        {
          delayMs: 600,
          part: {
            type: "text",
            text: isChinese
              ? "每 15 分钟运行一次 — 你专心工作时，工单也能持续有序处理。🎉"
              : "Running every 15 minutes — your queue stays triaged while you work. 🎉",
          },
        },
      ],
    },
  ];
}

export const supportQueueScript = getSupportQueueScript();
