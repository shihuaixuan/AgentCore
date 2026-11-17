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
  isDeleting?: boolean;
}

export function IntegrationsSelectionBar({
  selectedCount,
  allSelected,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  isDeleting = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center justify-between rounded-sm border border-border-base bg-surface-hover px-4 py-2">
      <div className="flex items-center gap-5">
        <Text variant="body" as="span" tone="body">
          {selectedCount} {t("selected", "已选择")}
        </Text>
        {!allSelected && (
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-action"
          >
            <Text variant="body-medium" as="span">
              {t("Select All", "全选")}
            </Text>
          </button>
        )}
        <button
          type="button"
          onClick={onDeselectAll}
          className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-action"
        >
          <Text variant="body-medium" as="span">
            {t("Deselect", "取消选择")}
          </Text>
        </button>
      </div>
      <Button
        variant="destructive"
        size="small"
        leftIcon={<Icon icon={Delete02Icon} size={16} />}
        onClick={onDeleteSelected}
        loading={isDeleting}
        disabled={isDeleting}
      >
        {t("Delete selected", "删除所选项")}
      </Button>
    </div>
  );
}
