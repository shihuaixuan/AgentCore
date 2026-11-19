"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Expert } from "@/app/api/__generated__/models/expert";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useEditBudgetDialog } from "./useEditBudgetDialog";

interface Props {
  expert: Expert;
  open: boolean;
  onClose: () => void;
}

export function EditBudgetDialog({ expert, open, onClose }: Props) {
  const { t } = useTranslation();
  const { value, setValue, isInvalid, isPending, save } = useEditBudgetDialog({
    expert,
    open,
    onClose,
  });

  return (
    <Dialog
      variant="compact"
      title={t("Weekly budget", "每周预算")}
      styling={{ maxWidth: "24rem" }}
      controlled={{
        isOpen: open,
        set: (next) => {
          if (!next) onClose();
        },
      }}
    >
      <Dialog.Content>
        <form onSubmit={save} className="flex flex-col gap-4 px-1">
          <div className="flex flex-col gap-1.5">
            <Input
              id="expert-weekly-budget"
              size="small"
              label={t("Weekly budget", "每周预算")}
              labelVariant="small-medium"
              placeholder={t("e.g. 25", "例如 25")}
              value={value}
              error={
                isInvalid
                  ? t(
                      "Enter a dollar amount like 25 or 12.50",
                      "输入美元金额，例如 25 或 12.50",
                    )
                  : undefined
              }
              onChange={(event) => setValue(event.target.value)}
              wrapperClassName="!mb-0"
            />
            <Text variant="small" tone="muted">
              {t(
                `What ${expert.name} may spend each week, in dollars. Leave empty for the default, or enter 0 to remove the cap.`,
                `${expert.name} 每周可消费的美元金额。留空使用默认值，输入 0 则不设上限。`,
              )}
            </Text>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="small"
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              size="small"
              type="submit"
              variant="primary"
              disabled={isInvalid}
              loading={isPending}
            >
              {t("Save budget", "保存预算")}
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
