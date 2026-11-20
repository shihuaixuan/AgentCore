import type { Locale } from "@/lib/i18n/locale";
import { roleFor } from "./components/CategoryStep/helpers";
import type { RaiseDraft } from "./helpers";

export function getRaiseProfession(draft: RaiseDraft, locale: Locale) {
  const jobTitle = draft.jobTitle || null;
  const legacyRole = draft.legacyRole?.trim();
  const role = legacyRole || roleFor(draft.category, locale);
  const title =
    jobTitle ?? role ?? (locale === "zh-CN" ? "AI 专家" : "AI Expert");
  return {
    name: title,
    title,
    role,
    jobTitle,
  };
}
