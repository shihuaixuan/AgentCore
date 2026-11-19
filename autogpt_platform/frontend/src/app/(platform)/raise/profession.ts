import type { Locale } from "@/lib/i18n/locale";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import { roleFor } from "./components/CategoryStep/helpers";
import type { RaiseDraft } from "./helpers";

export function getRaiseProfession(draft: RaiseDraft, locale: Locale) {
  const jobTitle = draft.jobTitle || null;
  const legacyRole = draft.legacyRole?.trim();
  const role = legacyRole || roleFor(draft.category);
  const categoryTitle = legacyRole ? null : roleFor(draft.category, locale);
  return {
    name: jobTitle ?? role ?? "AI Expert",
    title: jobTitle ?? categoryTitle ?? getExpertDisplayTitle({ role }, locale),
    role,
    jobTitle,
  };
}
