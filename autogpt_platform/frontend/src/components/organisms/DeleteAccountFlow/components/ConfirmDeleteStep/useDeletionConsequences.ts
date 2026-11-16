"use client";

import {
  useGetV2ListMySkillSubmissions,
  useGetV2ListMySubmissions,
} from "@/app/api/__generated__/endpoints/store/store";
import { useConnectedApps } from "../../useConnectedApps";
import { usePlanContext } from "../../usePlanContext";
import { getConsequences, getPlanLabel } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useDeletionConsequences() {
  const { t } = useTranslation();
  const { apps } = useConnectedApps();
  const { tier } = usePlanContext();
  const { data: publishedWorkflows = false } = useGetV2ListMySubmissions(
    { page: 1, page_size: 1 },
    {
      query: {
        select: (response) =>
          response.status === 200 && response.data.submissions.length > 0,
      },
    },
  );
  const { data: publishedSkills = false } = useGetV2ListMySkillSubmissions({
    query: {
      select: (response) => response.status === 200 && response.data.length > 0,
    },
  });

  const appNames = apps.status === "ready" ? apps.names : [];
  const planLabel = getPlanLabel(tier);
  const descriptions = {
    data: "你的对话、专家、工作流、文件和记忆将在 14 天后删除。分享链接将立即失效，市场评价也将立即移除。",
    apps: `${appNames.join("、")} 等已连接应用将被断开，我们对这些应用的访问权限也将撤销。`,
    plan:
      tier === "TRIAL"
        ? "你的试用将立即结束。"
        : `你的 ${planLabel} 套餐将立即结束，本计费周期的剩余费用不予退还。`,
    listings:
      publishedWorkflows && publishedSkills
        ? "你发布的工作流和技能将从市场移除。"
        : publishedWorkflows
          ? "你发布的工作流将从市场移除。"
          : "你发布的技能将从市场移除。",
  };
  return getConsequences({
    appNames: apps.status === "ready" ? apps.names : [],
    planLabel: getPlanLabel(tier),
    publishedWorkflows,
    publishedSkills,
  }).map((item) => ({ ...item, text: t(item.text, descriptions[item.key]) }));
}
