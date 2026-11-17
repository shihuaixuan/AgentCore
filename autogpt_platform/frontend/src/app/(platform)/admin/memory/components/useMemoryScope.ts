"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  type listExpertsResponse,
  useListExperts,
} from "@/app/api/__generated__/endpoints/experts/experts";
import type { Expert } from "@/app/api/__generated__/models/expert";
import { useToast } from "@/components/molecules/Toast/use-toast";

export const AUTOPILOT_MEMORY_SCOPE = "autopilot";
const EMPTY_EXPERTS: Expert[] = [];

function selectExperts(response: listExpertsResponse): Expert[] {
  return response.status === 200 ? response.data : EMPTY_EXPERTS;
}

export function useMemoryScope() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedScope, setSelectedScope] = useState(AUTOPILOT_MEMORY_SCOPE);
  const expertsQuery = useListExperts({
    query: {
      select: selectExperts,
    },
  });
  const experts = expertsQuery.data ?? EMPTY_EXPERTS;

  useEffect(() => {
    if (
      selectedScope === AUTOPILOT_MEMORY_SCOPE ||
      expertsQuery.isLoading ||
      expertsQuery.error
    ) {
      return;
    }
    if (!experts?.some(({ id }) => id === selectedScope)) {
      setSelectedScope(AUTOPILOT_MEMORY_SCOPE);
      toast({
        title: t("Expert no longer available", "工作流已不可用"),
        description: t("Showing Otto account memory instead.", "正在改为显示 Otto 账户记忆。"),
      });
    }
  }, [
    experts,
    expertsQuery.error,
    expertsQuery.isLoading,
    selectedScope,
    toast,
  ]);

  const selectedExpertID =
    selectedScope === AUTOPILOT_MEMORY_SCOPE ? undefined : selectedScope;

  return {
    selectedScope,
    setSelectedScope,
    selectedExpertID,
    experts,
    expertsLoading: expertsQuery.isLoading,
    expertsError: expertsQuery.error,
  };
}
