"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function EmptySkills() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-large border border-dashed border-border-base px-6 py-16 text-center"
      data-testid="skills-empty"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-surface">
        <Icon icon={BookOpen01Icon} size={24} tone="accent" />
      </div>
      <Text variant="h4" tone="primary">
        {t("No skills yet", "暂无技能")}
      </Text>
      <Text variant="body" tone="muted" className="max-w-md">
        {t(
          "Give your experts a repeatable process to follow. Select New skill to create one in chat, or Upload skill to import one you've saved.",
          "为专家提供可重复执行的流程。选择“新建技能”在聊天中创建技能，或选择“上传技能”导入已保存的技能。",
        )}
      </Text>
    </div>
  );
}
