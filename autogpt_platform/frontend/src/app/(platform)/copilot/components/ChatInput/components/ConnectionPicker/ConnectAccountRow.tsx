"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Loading03Icon, PlusSignIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { IntegrationLogo } from "@/components/molecules/IntegrationLogo/IntegrationLogo";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  onConnect: () => void;
  isConnecting: boolean;
}

/**
 * The way in for a subscription the user has not linked yet.
 *
 * Without it the picker can only list what already exists, so a user who
 * has never connected ChatGPT sees a control about connections that offers
 * no way to make one, and has to discover Settings to act on it.
 */
export function ConnectAccountRow({ onConnect, isConnecting }: Props) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant="ghost"
      size="small"
      shape="soft"
      aria-label={t("Connect a ChatGPT subscription", "连接 ChatGPT 订阅")}
      disabled={isConnecting}
      onClick={onConnect}
      className="h-auto min-h-14 w-full justify-start gap-3 text-left whitespace-normal"
    >
      <IntegrationLogo provider="openai" size={20} />
      <Text
        variant="body-medium-tight"
        as="span"
        tone="primary"
        className="min-w-0 flex-1"
      >
        <span className="block">
          {t("ChatGPT subscription", "ChatGPT 订阅")}
        </span>
        <span className="mt-1 block text-caption-sm leading-inherit font-normal text-foreground-secondary">
          {t("Connect your existing account", "连接你的现有账户")}
        </span>
      </Text>
      <span
        role={isConnecting ? "status" : undefined}
        aria-label={
          isConnecting ? t("Connecting ChatGPT", "正在连接 ChatGPT") : undefined
        }
        className="flex size-7 flex-none items-center justify-center rounded-lg border border-border-base bg-surface text-foreground-tertiary"
      >
        <Icon
          icon={isConnecting ? Loading03Icon : PlusSignIcon}
          size={14}
          aria-hidden
          spin={isConnecting}
        />
      </span>
    </Button>
  );
}
