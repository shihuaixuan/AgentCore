"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Text } from "@/components/atoms/Text/Text";
import { Plug01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  providerName: string;
  detail?: string;
}

export function UnsupportedNotice({ providerName, detail }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-base px-6 py-10 text-center">
      <Icon icon={Plug01Icon} size={28} tone="muted" />
      <Text variant="body">
        {t("No connection method available", "没有可用的连接方式")}
      </Text>
      <Text variant="small" tone="muted" className="max-w-[360px]">
        {detail ??
          t(
            `${providerName} doesn't currently expose a connection flow you can manage from settings. Add a block that uses ${providerName} to enable this.`,
            `${providerName} 目前没有可在设置中管理的连接流程。请添加使用 ${providerName} 的模块以启用连接。`,
          )}
      </Text>
    </div>
  );
}
