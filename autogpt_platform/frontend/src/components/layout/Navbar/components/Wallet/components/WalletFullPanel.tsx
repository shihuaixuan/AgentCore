"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ScrollArea } from "@/components/molecules/ScrollArea/ScrollArea";
import { usePlatformPayment } from "@/hooks/usePlatformPayment";
import { PopoverClose } from "@radix-ui/react-popover";

import { TaskGroup } from "../helpers";
import { WalletRefill } from "./WalletRefill";
import { TaskGroups } from "./WalletTaskGroups";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  groups: TaskGroup[];
  formattedCredits: string;
}

export function WalletFullPanel({ groups, formattedCredits }: Props) {
  const { t } = useTranslation();
  const { isPaymentEnabled } = usePlatformPayment();

  return (
    <>
      {/* Header */}
      <div className="mx-1 flex items-start justify-between gap-3 border-b border-border-base pb-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Text variant="h5-semibold" as="span" tone="primary">
            {t("Automation Credits", "自动化额度")}
          </Text>
          <Text variant="small-tight" as="span" tone="muted">
            {t(
              "Platform-only credits for automations. This is separate from your subscription and is not usable for plan fees.",
              "仅限在本平台运行自动化的额度，与订阅分开计算，不能用于支付套餐费用。",
            )}
          </Text>
        </div>
        <div className="flex shrink-0 items-center text-body leading-5 text-accent-strong">
          <div className="rounded-lg bg-accent-surface px-3 py-2">
            <Text variant="body-tight" as="div" tone="inherit">
              {t("Earn credits", "赚取额度")}{" "}
              <Text as="span" variant="body-semibold-tight" tone="inherit">
                {formattedCredits}
              </Text>
            </Text>
          </div>
          <PopoverClose aria-label={t("Close wallet", "关闭钱包")}>
            <Icon
              icon={Cancel01Icon}
              tone="emphasis"
              className="ml-2 h-5 w-5 hover:text-foreground-base"
            />
          </PopoverClose>
        </div>
      </div>
      <ScrollArea className="max-h-[85vh] overflow-y-auto">
        {/* Top ups */}
        {isPaymentEnabled && <WalletRefill />}
        {/* Tasks */}
        <Text variant="small-tight" as="p" tone="subtle" className="mx-1 my-3">
          {t(
            "Complete the following tasks to earn more credits!",
            "完成以下任务，赚取更多额度！",
          )}
        </Text>
        <TaskGroups groups={groups} />
      </ScrollArea>
    </>
  );
}
