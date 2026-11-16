import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import {
  BubbleChatIcon,
  Cancel01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  onClose: () => void;
  canRevert: boolean;
  revertTargetVersion: number | null;
  onRevert: () => void;
}

export function PanelHeader({
  onClose,
  canRevert,
  revertTargetVersion,
  onRevert,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between border-b border-separator px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon icon={BubbleChatIcon} size={18} tone="brand" />
        <Text variant="body-semibold-tight" tone="body" as="span">
          {t("Chat with Builder", "与构建助手对话")}
        </Text>
      </div>
      <div className="flex items-center gap-1">
        {canRevert && (
          <Button
            variant="ghost"
            size="small"
            onClick={onRevert}
            leftIcon={<Icon icon={RefreshIcon} size={14} />}
            aria-label={
              revertTargetVersion != null
                ? `Revert to version ${revertTargetVersion}`
                : t("Revert to previous version", "恢复到上一版本")
            }
            title={t(
              "Revert to the workflow version that was active before the last edit",
              "恢复到上次编辑之前的工作流版本",
            )}
          >
            {t("Revert", "恢复")}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={t("Close", "关闭")}
        >
          <Icon icon={Cancel01Icon} size={16} />
        </Button>
      </div>
    </div>
  );
}
