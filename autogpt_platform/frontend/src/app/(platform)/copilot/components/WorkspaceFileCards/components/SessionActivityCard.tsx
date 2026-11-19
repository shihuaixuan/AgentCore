"use client";

import { Clock01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { useSessionActivity } from "../useSessionActivity";
import { RunsList, SchedulesList } from "./SessionActivityContent";
import { StackSection } from "./StackSection";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  sessionId: string | null;
}

/**
 * What this chat set in motion, stacked under the workspace files: one card
 * for the runs it triggered, another for the schedules it created — they're
 * separate concerns, so a single card would read as one list.
 */
export function SessionActivityCard({ sessionId }: Props) {
  const { t } = useTranslation();
  const { runs, schedules } = useSessionActivity(sessionId);

  return (
    <>
      {runs.length > 0 && (
        <StackSection
          title={t("Runs", "运行记录")}
          icon={PlayIcon}
          count={runs.length}
        >
          <RunsList runs={runs} />
        </StackSection>
      )}
      {schedules.length > 0 && (
        <StackSection
          title={t("Schedules", "计划")}
          icon={Clock01Icon}
          count={schedules.length}
        >
          <SchedulesList schedules={schedules} />
        </StackSection>
      )}
    </>
  );
}
