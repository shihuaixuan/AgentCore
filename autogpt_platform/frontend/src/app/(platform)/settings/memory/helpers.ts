import type { Expert } from "@/app/api/__generated__/models/expert";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Locale } from "@/lib/i18n/locale";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

export const RECENT_FACTS_LIMIT = 6;

export const AUTOPILOT_SCOPE = "autopilot";

export const MEMORY_CHAT_PROMPTS = {
  summary: "Give me a summary of everything you know about me",
  forget:
    "I'd like you to forget something from your memory. Ask me what to " +
    "forget, search your memory for matching facts, show me what you find, " +
    "and only delete after I confirm.",
} as const;

export type MemoryChatSeed = keyof typeof MEMORY_CHAT_PROMPTS;

export function getMemoryChatPrompt(
  seed: MemoryChatSeed,
  locale: Locale = "en",
) {
  if (locale !== "zh-CN") return MEMORY_CHAT_PROMPTS[seed];
  return seed === "summary"
    ? "请总结你记住的所有关于我的信息"
    : "我希望你忘记部分记忆。请先询问我要忘记什么，搜索相关记忆并展示找到的内容，只有在我确认后才删除。";
}

export function getActiveExperts(experts: Expert[] | undefined) {
  return (experts ?? []).filter((expert) => !expert.is_archived);
}

export function getScopeName(
  scopeExpertID: string | null,
  experts: Expert[] | undefined,
  locale: Locale = "en",
) {
  if (!scopeExpertID) return "Otto";
  const expert = experts?.find((e) => e.id === scopeExpertID);
  return expert
    ? getExpertDisplayTitle(expert, locale)
    : locale === "zh-CN"
      ? "这位专家"
      : "this expert";
}

/** Panel identity for a learning record: the Expert, or the personal scope. */
export function learningSheetScope(
  expertId: string | null,
  experts: Expert[] | undefined,
  locale: Locale,
) {
  const expert = expertId
    ? experts?.find((candidate) => candidate.id === expertId)
    : undefined;
  return {
    expertId: expert ? expert.id : null,
    name: expertId ? getExpertDisplayTitle(expert, locale) : "Otto",
    avatarUrl: expert ? expert.avatar_url : null,
    color: expert ? expert.color : null,
  };
}

export function formatWhen(
  createdAt: string | null | undefined,
  locale: Locale = "en",
) {
  if (!createdAt) return "";
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return "";
  return formatDistanceToNow(parsed, {
    addSuffix: true,
    locale: locale === "zh-CN" ? zhCN : undefined,
  });
}

/** The Soul drawer links here with ?expert=<id>. An id the caller no longer
 *  owns is left to the page's active-expert fallback rather than checked here. */
export function readExpertScopeFromUrl() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("expert") || null;
}
