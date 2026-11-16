"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ProfileEntry } from "./ProfileEntry";

interface Props {
  identity: string;
  voicePreferences: string | null;
  boundaries: string | null;
}

/** The expert's Soul: who it is, how it speaks and what it won't do. The
 *  header's "Edit Soul" button edits it. */
export function ExpertSoulSection({
  identity,
  voicePreferences,
  boundaries,
}: Props) {
  const { t } = useTranslation();
  return (
    <dl className="space-y-4">
      <ProfileEntry label={t("Identity", "身份")} value={identity} />
      <ProfileEntry label={t("Voice", "语气")} value={voicePreferences} />
      <ProfileEntry label={t("Boundaries", "边界")} value={boundaries} />
    </dl>
  );
}
