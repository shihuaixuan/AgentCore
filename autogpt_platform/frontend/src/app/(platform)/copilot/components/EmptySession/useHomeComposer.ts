import { useLayoutEffect, useState } from "react";
import { useHomePage } from "@/app/(platform)/home/useHomePage";
import { getInputPlaceholder } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Args {
  enabled: boolean;
  /** The onboarding greeting on screen: "A" answers the user's brain dump. */
  greetingPath?: string | null;
}

const TEAM_PLACEHOLDER =
  "What should the team work on? e.g. 'Follow up with yesterday's leads'";
const AFTER_DUMP_PLACEHOLDER = "What should Otto take on first?";

export function useHomeComposer({ enabled, greetingPath = null }: Args) {
  const { t } = useTranslation();
  const { dashboard } = useHomePage({ enabled });
  const hasExistingWork = Boolean(
    enabled &&
      dashboard &&
      (dashboard.team.total > 0 ||
        dashboard.attention.length > 0 ||
        dashboard.active_tasks.length > 0 ||
        dashboard.upcoming_tasks.length > 0 ||
        dashboard.week.run_count > 0 ||
        (dashboard.recent_work?.total_count ?? 0) > 0 ||
        (dashboard.recent_work?.groups?.length ?? 0) > 0),
  );
  const [discoveryPlaceholder, setDiscoveryPlaceholder] = useState(
    getInputPlaceholder(),
  );

  useLayoutEffect(() => {
    function handleResize() {
      setDiscoveryPlaceholder(getInputPlaceholder(window.innerWidth));
    }
    handleResize();
    const queries = [
      window.matchMedia("(max-width: 500px)"),
      window.matchMedia("(max-width: 1080px)"),
    ];
    queries.forEach((query) => query.addEventListener("change", handleResize));
    return () => {
      queries.forEach((query) =>
        query.removeEventListener("change", handleResize),
      );
    };
  }, []);

  if (greetingPath === "A") {
    return {
      inputPlaceholder: t(AFTER_DUMP_PLACEHOLDER, "你希望 Otto 先处理什么？"),
    };
  }
  return {
    inputPlaceholder: hasExistingWork
      ? t(TEAM_PLACEHOLDER, "你希望团队处理什么？例如：跟进昨天的潜在客户")
      : t(discoveryPlaceholder, "你的工作是什么？哪些事情最耗时间？"),
  };
}
