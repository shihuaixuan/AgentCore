import type { Locale } from "@/lib/i18n/locale";
import { callPrepScript, getCallPrepScript } from "./callPrepScript";
import {
  callPrepArtifact,
  competitorWatchArtifact,
  dailyBriefArtifact,
  supportQueueArtifact,
} from "./completionArtifacts";
import {
  callPrepArtifactChinese,
  competitorWatchArtifactChinese,
  dailyBriefArtifactChinese,
  supportQueueArtifactChinese,
} from "./completionArtifacts.zh-CN";
import {
  competitorWatchScript,
  getCompetitorWatchScript,
} from "./competitorWatchScript";
import { dailyBriefScript, getDailyBriefScript } from "./dailyBriefScript";
import {
  supportQueueScript,
  getSupportQueueScript,
} from "./supportQueueScript";
import type { TourScenario } from "./types";
import {
  CallRinging01Icon,
  HeadsetIcon,
  Search01Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";

export const tourScenarios: TourScenario[] = [
  {
    id: "daily-brief",
    label: "Daily brief",
    icon: Sun01Icon,
    script: dailyBriefScript,
    completionArtifact: dailyBriefArtifact,
  },
  {
    id: "call-prep",
    label: "Call prep",
    icon: CallRinging01Icon,
    script: callPrepScript,
    completionArtifact: callPrepArtifact,
  },
  {
    id: "competitor-watch",
    label: "Competitor watch",
    icon: Search01Icon,
    script: competitorWatchScript,
    completionArtifact: competitorWatchArtifact,
  },
  {
    id: "support-queue",
    label: "Support queue",
    icon: HeadsetIcon,
    script: supportQueueScript,
    completionArtifact: supportQueueArtifact,
  },
];

export const DEFAULT_SCENARIO_ID = "competitor-watch";

const chineseScenarios: TourScenario[] = [
  {
    ...tourScenarios[0],
    label: "每日简报",
    script: getDailyBriefScript("zh-CN"),
    completionArtifact: dailyBriefArtifactChinese,
  },
  {
    ...tourScenarios[1],
    label: "通话准备",
    script: getCallPrepScript("zh-CN"),
    completionArtifact: callPrepArtifactChinese,
  },
  {
    ...tourScenarios[2],
    label: "竞品监测",
    script: getCompetitorWatchScript("zh-CN"),
    completionArtifact: competitorWatchArtifactChinese,
  },
  {
    ...tourScenarios[3],
    label: "客服工单",
    script: getSupportQueueScript("zh-CN"),
    completionArtifact: supportQueueArtifactChinese,
  },
];

/** The scenario the end-of-demo nudge points at: the next unwatched one in
 * scenario order (wrapping around), or simply the next one once all are
 * watched — "Watch another scenario" should always lead somewhere. */
export function getNextTourScenario(
  activeScenarioId: string,
  watchedScenarioIds: string[],
  locale: Locale = "en",
): TourScenario {
  const scenarios = locale === "zh-CN" ? chineseScenarios : tourScenarios;
  const activeIndex = scenarios.findIndex(
    (scenario) => scenario.id === activeScenarioId,
  );
  const others = [
    ...scenarios.slice(activeIndex + 1),
    ...scenarios.slice(0, Math.max(activeIndex, 0)),
  ];
  return (
    others.find((scenario) => !watchedScenarioIds.includes(scenario.id)) ??
    others[0] ??
    scenarios[0]
  );
}

export function getTourScenario(
  id: string,
  locale: Locale = "en",
): TourScenario {
  const scenarios = locale === "zh-CN" ? chineseScenarios : tourScenarios;
  return (
    scenarios.find((scenario) => scenario.id === id) ??
    scenarios.find((scenario) => scenario.id === DEFAULT_SCENARIO_ID) ??
    scenarios[0]
  );
}
