"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  targetCycle: "monthly" | "yearly";
  title?: string;
  body: { label?: string; text: string }[];
  isSaving: boolean;
  onConfirm: () => void;
}

export function SwitchCycleDialog({
  isOpen,
  onOpenChange,
  targetCycle,
  title,
  body,
  isSaving,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const targetLabel =
    targetCycle === "yearly" ? t("Yearly", "每年") : t("Monthly", "每月");

  return (
    <Dialog
      title={
        title ??
        t(
          `Switch billing to ${targetCycle === "yearly" ? "Yearly" : "Monthly"}?`,
          `将账单周期改为${targetLabel}？`,
        )
      }
      styling={{ maxWidth: "440px" }}
      controlled={{ isOpen, set: onOpenChange }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-2">
          {body.map((line, index) => (
            <div
              key={`${index}-${line.label ?? ""}-${line.text}`}
              className="flex flex-wrap gap-1"
            >
              {line.label ? (
                <Text variant="body-semibold" as="span" tone="body">
                  {line.label}
                </Text>
              ) : null}
              <Text variant="body" as="span" tone="body">
                {line.text}
              </Text>
            </div>
          ))}
        </div>

        <Dialog.Footer>
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="small"
            onClick={onConfirm}
            disabled={isSaving}
            loading={isSaving}
          >
            {t(
              `Switch to ${targetCycle === "yearly" ? "Yearly" : "Monthly"}`,
              `改为${targetLabel}`,
            )}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
