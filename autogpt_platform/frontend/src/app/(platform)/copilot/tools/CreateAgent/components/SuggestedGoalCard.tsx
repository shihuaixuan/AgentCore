"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { ArrowRight02Icon, BulbIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  message: string;
  suggestedGoal: string;
  reason?: string;
  goalType: string;
  onUseSuggestedGoal: (goal: string) => void;
}

export function SuggestedGoalCard({
  message,
  suggestedGoal,
  reason,
  goalType,
  onUseSuggestedGoal,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-warning-border bg-warning-surface/50 p-4">
      <div className="flex items-start gap-3">
        <Icon icon={BulbIcon} size={20} tone="warning" className="mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <Text variant="body-medium" tone="primary">
              {goalType === "unachievable"
                ? t("Goal cannot be accomplished", "无法完成此目标")
                : t("Goal needs more detail", "目标需要更多细节")}
            </Text>
            <Text tone="secondary" variant="small">
              {reason || message}
            </Text>
          </div>

          <div className="rounded-lg border border-warning-border bg-surface p-3">
            <Text
              variant="small"
              tone="warning"
              weight="semibold"
              className="mb-1"
            >
              {t("Suggested alternative:", "建议的替代目标：")}
            </Text>
            <Text tone="primary" variant="body-medium">
              {suggestedGoal}
            </Text>
          </div>

          <Button
            onClick={() => onUseSuggestedGoal(suggestedGoal)}
            variant="primary"
          >
            <span className="inline-flex items-center gap-1.5">
              {t("Use this goal", "使用此目标")}{" "}
              <Icon icon={ArrowRight02Icon} size={14} />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
