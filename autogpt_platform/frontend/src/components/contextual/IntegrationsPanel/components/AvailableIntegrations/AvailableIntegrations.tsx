"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { ProviderRow } from "../ConnectServiceDialog/components/ProviderRow";
import { useAvailableIntegrations } from "./useAvailableIntegrations";

interface Props {
  query: string;
  onSelect: (providerId: string) => void;
}

export function AvailableIntegrations({ query, onSelect }: Props) {
  const { t } = useTranslation();

  const catalog = useAvailableIntegrations(query);

  return (
    <section
      aria-labelledby="available-integrations-heading"
      className="flex flex-col gap-4 pt-6 pb-6"
    >
      <div className="flex flex-col gap-1 px-4">
        <Text
          variant="small-medium"
          as="h2"
          id="available-integrations-heading"
          tone="secondary"
          transform="uppercase"
          tracking="eyebrow"
        >
          {t("Available integrations", "可用集成")}
        </Text>
        <Text variant="small" tone="muted">
          {t(
            "Connect your services, including official vendor integrations. Some services need additional setup.",
            "连接您的服务，包括服务商提供的官方集成。部分服务需要额外设置。",
          )}
        </Text>
      </div>
      {catalog.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((id) => (
            <Skeleton key={id} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : catalog.isError ? (
        <ErrorCard
          context="available integrations"
          responseError={
            catalog.error instanceof Error
              ? { message: catalog.error.message }
              : undefined
          }
          onRetry={() => catalog.refetch()}
        />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {catalog.providers.map((provider) => (
              <li key={provider.id} className="min-w-0">
                <ProviderRow provider={provider} onSelect={onSelect} />
              </li>
            ))}
          </ul>
          <div className="px-4">
            <Text variant="small" tone="muted" role="status">
              {catalog.total === 0
                ? query.trim()
                  ? t(
                      "No available services match your search.",
                      "没有与搜索条件匹配的可用服务。",
                    )
                  : t("No available services.", "暂无可用服务。")
                : t(
                    `${catalog.providers.length} of ${catalog.total} services`,
                    `显示 ${catalog.total} 个服务中的 ${catalog.providers.length} 个`,
                  )}
            </Text>
          </div>
          {catalog.hasMore && (
            <Button variant="secondary" size="small" onClick={catalog.showMore}>
              {t("Show more services", "显示更多服务")}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
