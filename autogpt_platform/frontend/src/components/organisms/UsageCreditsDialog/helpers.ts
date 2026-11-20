import { AUTOPILOT_NAME } from "@/lib/branding";
export type ChatAllowance =
  | "unknown"
  | "no-plan"
  | "lifetime-trial"
  | "unlimited"
  | "daily"
  | "weekly"
  | "daily-weekly";

interface PlanState {
  tier: string | null;
  isActiveTrial: boolean;
  isLifetimeTrial: boolean;
}

interface UsageWindows {
  daily?: unknown | null;
  weekly?: unknown | null;
}

// Read the same way as the billing page's usage card, so the two never
// describe one plan differently.
export function getChatAllowance(
  plan: PlanState,
  usage: UsageWindows | undefined,
): ChatAllowance {
  if (!usage) return "unknown";
  if (plan.tier === "NO_TIER") return "no-plan";
  if (plan.isLifetimeTrial) return "lifetime-trial";
  if (usage.daily && usage.weekly) return "daily-weekly";
  if (usage.daily) return "daily";
  if (usage.weekly) return "weekly";
  if (plan.isActiveTrial) return "lifetime-trial";
  // A trial account whose trial status hasn't loaded, or failed to, is not
  // an uncapped plan: say nothing about its limits.
  return plan.tier === "TRIAL" ? "unknown" : "unlimited";
}

interface Args {
  locale?: string;
  paymentEnabled: boolean;
  allowance: ChatAllowance;
  isTrial: boolean;
}

export function getUsageCreditsAnswers({
  locale,
  paymentEnabled,
  allowance,
  isTrial,
}: Args) {
  if (locale === "zh-CN") {
    const owner = isTrial ? "试用" : "套餐";
    const allowances: Record<ChatAllowance, string> = {
      unknown: "额度包含在套餐中。",
      "no-plan": "选择套餐即可获得额度。",
      "lifetime-trial": "整个试用期共用一份额度。",
      unlimited: "额度包含在套餐中，没有每日或每周限制。",
      daily: `额度包含在${owner}中，每日重置。`,
      weekly: `额度包含在${owner}中，每周重置。`,
      "daily-weekly": `额度包含在${owner}中，每日和每周重置。`,
    };
    return [
      {
        question: "对话用量涵盖哪些内容？",
        answer: `你与 ${AUTOPILOT_NAME} 及专家的对话，包括他们为你完成的研究和写作。${allowances[allowance]}`,
      },
      {
        question: "自动化积分有什么用途？",
        answer: `用于工作流运行和生成图片等付费步骤。由 ${AUTOPILOT_NAME} 执行的工作流步骤会优先消耗对话额度，耗尽后才使用积分。${paymentEnabled ? "你可以购买积分、完成设置任务赚取积分，或开启自动充值。" : "你可以完成设置任务赚取积分。"}`,
      },
      ...(paymentEnabled
        ? [
            {
              question: "什么时候会向银行卡扣款？",
              answer:
                "对话或单个步骤不会直接向银行卡扣款。套餐开始及每次续订、升级套餐、购买积分（包括自动充值）时才会扣款。如果续订付款失败，且自动化积分余额足够，将从积分余额中支付。",
            },
          ]
        : []),
      {
        question: "如何获得更多额度？",
        answer: `${paymentEnabled && allowance !== "unlimited" ? (allowance === "no-plan" ? "选择套餐即可获得对话额度。" : "选择更高档套餐即可获得更多对话额度。") : ""}${paymentEnabled ? "在钱包中选择添加积分，即可获得更多自动化积分。" : "在钱包中完成设置任务，即可获得更多自动化积分。"}`,
      },
    ];
  }
  return [
    {
      question: "What does chat usage cover?",
      answer: `Your chats with ${AUTOPILOT_NAME} and your experts, including the research and writing they do for you. ${describeAllowance(allowance, isTrial)}`,
    },
    {
      question: "What are automation credits for?",
      // An Otto (AutoPilot) step bills the allowance first and the credit
      // balance only once it is out: copilot/credit_billing.py.
      answer: `Workflow runs and paid steps, like making images. A workflow step where ${AUTOPILOT_NAME} does the work uses your chat usage first, and your credits only once chat usage runs out. ${
        paymentEnabled
          ? "You can buy credits, earn them by finishing setup steps or turn on auto-refill to top them up."
          : "You can earn them by finishing setup steps."
      }`,
    },
    // With payments off there is no checkout, upgrade or top-up to charge it.
    ...(paymentEnabled
      ? [
          {
            question: "When is my card charged?",
            // A failed renewal is paid from the balance when it covers the
            // invoice: subscription_payment_failure.py, pay_invoice_from_wallet.
            answer:
              "A chat or a step never charges your card directly. Your card is charged when your plan starts and each time it renews, when you upgrade, and when you buy credits (including auto-refill). If a renewal payment fails, it's taken from your automation credits when they cover it.",
          },
        ]
      : []),
    {
      question: "How do I get more?",
      answer: [
        describeMoreChat(allowance, paymentEnabled),
        paymentEnabled
          ? "For more automation credits, select Add credits in the wallet."
          : "For more automation credits, finish the setup steps in the wallet.",
      ]
        .filter(Boolean)
        .join(" "),
    },
  ];
}

function describeAllowance(allowance: ChatAllowance, isTrial: boolean) {
  const owner = isTrial ? "your trial" : "your plan";
  switch (allowance) {
    case "no-plan":
      return "It comes with a plan.";
    case "lifetime-trial":
      return "It comes with your trial, as one allowance for the whole trial.";
    case "unlimited":
      return "It comes with your plan, which has no daily or weekly limits.";
    case "daily-weekly":
      return `It comes with ${owner} and resets daily and weekly.`;
    case "daily":
      return `It comes with ${owner} and resets daily.`;
    case "weekly":
      return `It comes with ${owner} and resets weekly.`;
    case "unknown":
      return "It comes with your plan.";
  }
}

// Plans are bought and upgraded only with payments on, and an uncapped plan
// has no more to get.
function describeMoreChat(allowance: ChatAllowance, paymentEnabled: boolean) {
  if (!paymentEnabled || allowance === "unlimited") return null;
  if (allowance === "no-plan") return "For chat usage, choose a plan.";
  return "For more chat usage, choose a bigger plan.";
}
