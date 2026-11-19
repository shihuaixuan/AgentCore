import { useListExperts } from "@/app/api/__generated__/endpoints/experts/experts";
import type { ExpertIdentity } from "@/app/(platform)/copilot/useExpertMap";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getActiveExperts,
  getScopeName,
  readExpertScopeFromUrl,
} from "./helpers";

export function useMemoryScope() {
  const { locale } = useTranslation();
  // The Soul drawer's learned-notes panel links here with ?expert=<id>, so
  // the link opens on that expert. Read once — the dropdown owns it after.
  const [scopeExpertID, setScopeExpertID] = useState<string | null>(
    readExpertScopeFromUrl,
  );

  const expertsQuery = useListExperts();
  const expertsSettled = expertsQuery.data?.status === 200;
  const experts = getActiveExperts(
    expertsQuery.data?.status === 200 ? expertsQuery.data.data : undefined,
  );
  const scopeExpert = experts.find((expert) => expert.id === scopeExpertID);
  const scopeName = getScopeName(scopeExpertID, experts, locale);
  const expertIdentity: ExpertIdentity | null = scopeExpertID
    ? {
        id: scopeExpertID,
        name: scopeName,
        role: scopeExpert?.role ?? null,
        jobTitle: scopeExpert?.job_title,
        avatarUrl: scopeExpert?.avatar_url ?? null,
        color: scopeExpert?.color,
        isArchived: false,
        readOnlyReason: null,
      }
    : null;

  // A selected expert can disappear (fired in another tab, roster changed) —
  // fall back to Otto instead of driving queries with a dead scope id.
  useEffect(() => {
    if (!scopeExpertID || !expertsSettled) return;
    if (!scopeExpert) {
      setScopeExpertID(null);
    }
  }, [scopeExpertID, expertsSettled, scopeExpert]);

  return {
    scopeExpertID,
    selectScope: setScopeExpertID,
    experts,
    scopeName,
    expertIdentity,
  };
}
