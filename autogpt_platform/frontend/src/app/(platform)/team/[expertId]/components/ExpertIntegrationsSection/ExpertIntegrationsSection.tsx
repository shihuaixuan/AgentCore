"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { Text } from "@/components/atoms/Text/Text";
import { Link } from "@/components/atoms/Link/Link";
import { useState } from "react";
import { ExpertConnectServiceDialog } from "./ExpertConnectServiceDialog";
import { ExpertIntegrationGroups } from "./ExpertIntegrationGroups";
import { UseExistingCredentialsDialog } from "./UseExistingCredentialsDialog";
import { PlusSignIcon, Share01Icon } from "@hugeicons/core-free-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import { useExpertIntegrationsSection } from "./useExpertIntegrationsSection";
import { IntegrationLogo } from "@/components/molecules/IntegrationLogo/IntegrationLogo";
import { SectionEmptyState } from "../../../components/SectionEmptyState";
import { ToolbarSearch } from "../../../components/ToolbarSearch";
import { connectionSearchText } from "./helpers";

interface Props {
  expertId: string;
  expertName: string;
}

export function ExpertIntegrationsSection({ expertId, expertName }: Props) {
  const { t } = useTranslation();
  const {
    granted,
    grantable,
    isConnecting,
    isUsingExisting,
    openUseExisting,
    closeUseExisting,
    openConnect,
    closeConnect,
    connectCredential,
    grantExistingCredential,
    removeIntegration,
    isGranting,
    isRevoking,
    isLoading,
    isError,
    isCustomError,
    isGrantableLoading,
    isGrantableError,
    refetch,
  } = useExpertIntegrationsSection(expertId);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? granted.filter((integration) =>
        connectionSearchText(integration).includes(needle),
      )
    : granted;

  return (
    <section data-testid="expert-integrations-section">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <Text variant="large-medium" tone="primary">
          {expertName}&apos;s Integrations
        </Text>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="secondary"
                  size="small"
                  textSize="body-md"
                  leadingIcon={Share01Icon}
                  disabled={
                    grantable.length === 0 ||
                    isLoading ||
                    isGrantableLoading ||
                    isError ||
                    isGrantableError
                  }
                  onClick={openUseExisting}
                >
                  {t("Use existing", "使用现有连接")}
                </Button>
              </span>
            </TooltipTrigger>
            {isError ? (
              <TooltipContent side="bottom">
                Couldn&apos;t load what {expertName} already has.
              </TooltipContent>
            ) : isGrantableError ? (
              <TooltipContent side="bottom">
                {t("Couldn't load your services.", "无法加载你的服务。")}
              </TooltipContent>
            ) : grantable.length === 0 && !isGrantableLoading ? (
              <TooltipContent side="bottom">
                {t(
                  "No available connections to add.",
                  "没有可添加的可用连接。",
                )}
              </TooltipContent>
            ) : null}
          </Tooltip>
          <Button
            variant="secondary"
            size="small"
            textSize="body-md"
            leadingIcon={PlusSignIcon}
            onClick={openConnect}
          >
            {t("Add integration", "添加集成")}
          </Button>
          <ToolbarSearch
            textSize="body-md"
            id="expert-integrations-search"
            label={t("Search integrations", "搜索集成")}
            value={query}
            onChange={setQuery}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <Link href="/settings/integrations">
          {t("Manage custom connectors", "管理自定义连接器")}
        </Link>
        <Text variant="small" tone="muted">
          {t(
            "Create custom connectors in Settings, then select Use existing here. Saved keys do not need to be entered again.",
            "在设置中创建自定义连接器后，在这里选择“使用现有连接”，无需再次填写已保存的密钥。",
          )}
        </Text>
        {isCustomError && (
          <div className="flex items-center gap-2">
            <Text variant="small" tone="muted">
              {t("Could not load custom connectors.", "无法加载自定义连接器。")}
            </Text>
            <Button variant="secondary" size="small" onClick={refetch}>
              {t("Retry", "重试")}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : isError ? (
        <ErrorCard
          textSize="body-md"
          context="this expert's integrations"
          hint="We could not load what this expert can reach."
          onRetry={refetch}
        />
      ) : granted.length === 0 ? (
        <SectionEmptyState
          tiles={[
            <IntegrationLogo key="slack" provider="slack" size={24} />,
            <IntegrationLogo key="notion" provider="notion" size={24} />,
            <IntegrationLogo key="google" provider="google" size={24} />,
          ]}
          title={t("No integrations yet", "暂无集成")}
          description={`Connect a tool and ${expertName} can use it on your behalf.`}
        >
          <Button
            variant="primary"
            size="small"
            textSize="body-md"
            leadingIcon={PlusSignIcon}
            onClick={openConnect}
          >
            {t("Add integration", "添加集成")}
          </Button>
          {grantable.length > 0 && !isGrantableError ? (
            <Button
              variant="secondary"
              size="small"
              textSize="body-md"
              leadingIcon={Share01Icon}
              onClick={openUseExisting}
            >
              {t("Use existing", "使用现有连接")}
            </Button>
          ) : null}
        </SectionEmptyState>
      ) : visible.length === 0 ? (
        <Text variant="body-md" tone="muted" className="mt-4">
          {t("No integrations match.", "没有匹配的集成。")}
        </Text>
      ) : (
        <ExpertIntegrationGroups
          integrations={visible}
          isRemoving={isRevoking}
          onRemove={removeIntegration}
        />
      )}

      <UseExistingCredentialsDialog
        open={isUsingExisting}
        expertName={expertName}
        credentials={grantable}
        isGranting={isGranting}
        onUse={(credentialId) => {
          grantExistingCredential(credentialId);
          closeUseExisting();
        }}
        onClose={closeUseExisting}
      />

      <ExpertConnectServiceDialog
        open={isConnecting}
        expertName={expertName}
        onClose={closeConnect}
        onConnected={(credential) => {
          connectCredential(credential);
          closeConnect();
        }}
      />
    </section>
  );
}
