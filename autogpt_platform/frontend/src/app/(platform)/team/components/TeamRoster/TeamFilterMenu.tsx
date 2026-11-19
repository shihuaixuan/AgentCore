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
  { value: "all", label: "All experts", zh: "全部专家", icon: ConferenceIcon },
  {
    value: "scheduled",
    label: "Scheduled",
    zh: "已计划",
    icon: Calendar03Icon,
  },
  {
    value: "needs-setup",
    label: "Needs setup",
    zh: "需要设置",
    icon: Alert01Icon,
  },
  { value: "paused", label: "Paused", zh: "已暂停", icon: PauseIcon },
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
