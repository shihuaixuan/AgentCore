"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  usePaused?: boolean;
}

export function SourceRemovedNotice({ usePaused }: Props) {
  const { t } = useTranslation();
  return (
    <Text variant="small" tone="danger" data-testid="source-removed-notice">
      {t(
        `A source this version was learned from is no longer available, so ${AUTOPILOT_NAME} stopped using this skill. To use it again, edit the skill, or restore an earlier version from History if there is one${usePaused ? ", then choose Resume using this skill" : ""}.`,
        `此版本的某个学习来源已不可用，因此 ${AUTOPILOT_NAME} 已停止使用此技能。若要再次使用，请编辑技能，或从历史记录中恢复可用的早期版本${usePaused ? "，然后选择恢复使用此技能" : ""}。`,
      )}
    </Text>
  );
}
