"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
}

export function APIKeySelectionBar({
  selectedCount,
  allSelected,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full items-center justify-between rounded-xsmall border border-border-base bg-surface-hover px-4 py-2">
      <div className="flex items-center gap-5">
        <Text variant="body" as="span" tone="body">
          {t(`${selectedCount} selected`, `已选择 ${selectedCount} 项`)}
        </Text>
        {!allSelected && (
          <Button variant="ghost" size="small" onClick={onSelectAll}>
            {t("Select All", "全选")}
          </Button>
        )}
        <Button variant="ghost" size="small" onClick={onDeselectAll}>
          {t("Deselect", "取消选择")}
        </Button>
      </div>
      <Button
        variant="destructive"
        size="small"
        leftIcon={<Icon icon={Delete02Icon} size={16} />}
        onClick={onDeleteSelected}
      >
        {t("Delete selected", "删除所选项")}
      </Button>
    </div>
  );
}
