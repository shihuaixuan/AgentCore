"use client";

import { Text } from "@/components/atoms/Text/Text";
import type { AgentStatusFilter } from "@/app/(platform)/library/types";
import { getEmptyMessage } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  tab: AgentStatusFilter;
}

export function EmptyMessage({ tab }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center pt-4">
      <Text variant="body-medium" tone="secondary">
        {getEmptyMessage(tab, t)}
      </Text>
    </div>
  );
}
