"use client";

import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
interface Props {
  name: string;
  onContinue: () => void;
  isSwitching?: boolean;
}
export function ProviderContinuation({ name, onContinue, isSwitching }: Props) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="provider-continuation"
      className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-base pt-4"
    >
      <Text variant="small" tone="muted">
        {t(
          `Or keep going with your connected ${name} account. The rest of this chat runs there.`,
          `也可以使用已连接的 ${name} 账户继续，后续对话将通过该账户进行。`,
        )}
      </Text>
      <Button
        size="small"
        variant="ghost"
        onClick={onContinue}
        loading={isSwitching}
        rightIcon={<Icon icon={ArrowRight02Icon} size={14} />}
      >
        {t(`Continue on ${name}`, `通过 ${name} 继续`)}
      </Button>
    </div>
  );
}
