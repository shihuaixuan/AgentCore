"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { PlugSocketIcon } from "@hugeicons/core-free-icons";

interface Props {
  names: string[];
  onConnect: () => void;
}

/** Offered after the install has already succeeded, so it reads as the next
 *  thing worth doing rather than something that went wrong. */
export function ConnectStep({ names, onConnect }: Props) {
  const { t, locale } = useTranslation();
  const providers = new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).format(names);

  return (
    <div
      className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border-base bg-surface p-4 text-foreground-tertiary"
      data-testid="skill-connect-step"
    >
      <Icon icon={PlugSocketIcon} size={18} aria-hidden />
      <Text variant="small" tone="secondary">
        {t(
          `Its steps use ${providers}. Connect when you first need it.`,
          `其步骤使用 ${providers}。首次需要时再连接即可。`,
        )}
      </Text>
      <Button
        variant="secondary"
        size="small"
        onClick={onConnect}
        className="ml-auto"
      >
        {t("Connect", "连接")}
      </Button>
    </div>
  );
}
