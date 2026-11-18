import { Button } from "@/components/atoms/Button/Button";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Text } from "@/components/atoms/Text/Text";
import { ProviderLogo } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/components/ProviderLogo";
import type { ConnectableProvider } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/helpers";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useState } from "react";
import { BrowseFilters } from "../../components/Browse/BrowseFilters";
import { BROWSE_GRID } from "../../components/Browse/BrowseHeader";
import {
  BrowseMessage,
  BrowseSkeleton,
} from "../../components/Browse/BrowseResults";
import { connectorCategories, connectorCategory } from "./connectorCategories";
import { useConnectorCatalog } from "./useConnectorCatalog";

const PAGE_SIZE = 24;

interface Props {
  search: string;
  category: string | null;
  isLoggedIn: boolean;
  onFilter: (value: string | null) => void;
  onSelect: (provider: ConnectableProvider) => void;
  onReset: () => void;
}

export function ConnectorCatalog({
  search,
  category,
  isLoggedIn,
  onFilter,
  onSelect,
  onReset,
}: Props) {
  const { t } = useTranslation();
  const catalog = useConnectorCatalog({ search, category, isLoggedIn });
  const [limit, setLimit] = useState(PAGE_SIZE);
  const filters = connectorCategories.map(({ value, en, zh }) => ({
    value,
    label: t(en, zh),
  }));

  return (
    <>
      <div className="mb-4">
        <BrowseFilters
          label={t("Filter connectors by category", "按分类筛选连接器")}
          categories={filters}
          selected={category}
          onSelect={onFilter}
        />
      </div>
      {catalog.isLoading ? (
        <BrowseSkeleton label={t("Loading connectors", "正在加载连接器")} />
      ) : catalog.isError ? (
        <ErrorCard
          context="marketplace connectors"
          responseError={{
            message: t("Couldn't load connectors", "暂时无法加载连接器"),
          }}
          onRetry={() => catalog.refetch()}
        />
      ) : catalog.providers.length === 0 ? (
        <BrowseMessage
          message={t("No matching connectors.", "没有找到匹配的连接器。")}
          onReset={search || category ? onReset : undefined}
        />
      ) : (
        <>
          <ul className={BROWSE_GRID}>
            {catalog.providers.slice(0, limit).map((provider) => (
              <li key={provider.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelect(provider)}
                  className="flex h-full w-full flex-col gap-2 rounded-xl border border-border-base bg-surface p-4 text-left hover:border-border-strong focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <span className="flex w-full items-center gap-2.5">
                    <ProviderLogo provider={provider} size="md" />
                    <span className="min-w-0 flex-1">
                      <Text
                        as="span"
                        variant="body-medium"
                        className="block truncate"
                      >
                        {provider.name}
                      </Text>
                      <Text as="span" variant="small" tone="muted">
                        {
                          filters.find(
                            ({ value }) =>
                              value === connectorCategory(provider.serviceId),
                          )?.label
                        }
                      </Text>
                    </span>
                    {catalog.linked.has(provider.serviceId) ? (
                      <Badge variant="success" size="small">
                        {t("Connected", "已连接")}
                      </Badge>
                    ) : provider.mcpServer ? (
                      <Badge variant="info" size="small">
                        MCP
                      </Badge>
                    ) : null}
                  </span>
                  <Text
                    as="span"
                    variant="small"
                    tone="muted"
                    className="line-clamp-2"
                  >
                    {provider.description ||
                      t("View connection options", "查看连接方式")}
                  </Text>
                </button>
              </li>
            ))}
          </ul>
          {limit < catalog.providers.length && (
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => setLimit((current) => current + PAGE_SIZE)}
            >
              {t("Load more", "加载更多")}
            </Button>
          )}
        </>
      )}
    </>
  );
}
