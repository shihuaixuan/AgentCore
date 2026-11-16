"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  onConnect: () => void;
  withTitle?: boolean;
}

export function IntegrationsHeader({ onConnect, withTitle = true }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-start gap-4 pb-6 pl-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col">
        {withTitle && (
          <Text variant="h4" as="h1" className="leading-7">
            {t("Integrations", "集成")}
          </Text>
        )}
        <Text variant="body" tone="body" className="mt-4 max-w-[600px]">
          {t(
            "Connect AI subscriptions to power your experts, and third-party tools for them to use.",
            "连接 AI 订阅，为专家提供模型能力，并连接供其使用的第三方工具。",
          )}
        </Text>
      </div>

      <Button
        variant="primary"
        size="small"
        leftIcon={<Icon icon={PlusSignIcon} size={16} />}
        onClick={onConnect}
        className="sm:hidden"
      >
        {t("Connect Service", "连接服务")}
      </Button>
      <Button
        variant="primary"
        size="large"
        leftIcon={<Icon icon={PlusSignIcon} size={20} />}
        onClick={onConnect}
        className="hidden sm:inline-flex"
      >
        {t("Connect Service", "连接服务")}
      </Button>
    </div>
  );
}
