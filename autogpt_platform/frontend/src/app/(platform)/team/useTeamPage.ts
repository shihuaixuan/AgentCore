import { useListExperts } from "@/app/api/__generated__/endpoints/experts/experts";
import { useGetV1ListExecutionSchedulesForAUser } from "@/app/api/__generated__/endpoints/schedules/schedules";
import { Expert } from "@/app/api/__generated__/models/expert";
import { okData } from "@/app/api/helpers";
import { useState } from "react";
import {
  getExpertSchedules,
  getHiredExperts,
  isSettingUp,
  SETUP_POLL_MS,
} from "./helpers";

export function useTeamPage() {
  const [pickerExpertId, setPickerExpertId] = useState<string | null>(null);
  const [soulExpertId, setSoulExpertId] = useState<string | null>(null);
  const [soulDrawerKey, setSoulDrawerKey] = useState(0);

  const expertsQuery = useListExperts({
    query: {
      select: (res) => (okData(res) ?? []) as Expert[],
      // A fresh hire's skills land after the hire returns; follow them in.
      refetchInterval: (query) =>
        isSettingUp((okData(query.state.data) ?? []) as Expert[])
          ? SETUP_POLL_MS
          : false,
    },
  });
  const schedulesQuery = useGetV1ListExecutionSchedulesForAUser({
    query: { select: (res) => okData(res) ?? [] },
  });
  const hiredExperts = getHiredExperts(expertsQuery.data ?? []);
  const schedules = schedulesQuery.data ?? [];

  function schedulesForExpert(expert: Expert) {
    return getExpertSchedules(expert, schedules);
  }

  function installWorkflow(expertId: string) {
    setPickerExpertId(expertId);
  }

  function closeWorkflowPicker() {
    setPickerExpertId(null);
  }

  function refetch() {
    return Promise.all([expertsQuery.refetch(), schedulesQuery.refetch()]);
  }

  function closeSoul() {
    setSoulExpertId(null);
  }

  function openSoul(expertId: string) {
    setSoulExpertId(expertId);
    setSoulDrawerKey((current) => current + 1);
  }

  return {
    hiredExperts,
    schedules,
    schedulesForExpert,
    // Only the roster decides the page's loading and error states: a slow or
    // failing schedules fetch must not hide experts that loaded fine.
    isLoading: expertsQuery.isPending,
    isError: expertsQuery.isError,
    refetch,
    installWorkflow,
    pickerExpertId,
    closeWorkflowPicker,
    soulExpert:
      hiredExperts.find((expert) => expert.id === soulExpertId) ?? null,
    soulDrawerKey,
    openSoul,
    closeSoul,
  };
}
