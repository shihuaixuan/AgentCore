"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  Alert01Icon,
  Calendar03Icon,
  ConferenceIcon,
  PauseIcon,
} from "@hugeicons/core-free-icons";
import type { TeamFilter } from "../../helpers";
import { PillFilterMenu } from "../PillFilterMenu";

const OPTIONS = [
  { value: "all", label: "All experts", icon: ConferenceIcon },
  { value: "scheduled", label: "Scheduled", icon: Calendar03Icon },
  { value: "needs-setup", label: "Needs setup", icon: Alert01Icon },
  { value: "paused", label: "Paused", icon: PauseIcon },
] as const;

interface Props {
  value: TeamFilter;
  onChange: (next: TeamFilter) => void;
}

export function TeamFilterMenu({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <PillFilterMenu
      label={t("Filter experts", "筛选专家")}
      value={value}
      defaultValue="all"
      options={OPTIONS}
      onChange={onChange}
    />
  );
}
