"use client";

import Link from "next/link";
import {
  ArrowRight01Icon,
  Delete02Icon,
  Loading03Icon,
  PlugSocketIcon,
  PlusSignIcon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import type { ExpertCredentialRef } from "@/app/api/__generated__/models/expertCredentialRef";
import { ExpertConnectServiceDialog } from "@/app/(platform)/team/[expertId]/components/ExpertIntegrationsSection/ExpertConnectServiceDialog";
import {
  groupExpertIntegrations,
  TYPE_LABELS,
} from "@/app/(platform)/team/[expertId]/components/ExpertIntegrationsSection/ExpertIntegrationGroups";
import { UseExistingCredentialsDialog } from "@/app/(platform)/team/[expertId]/components/ExpertIntegrationsSection/UseExistingCredentialsDialog";
import { useExpertIntegrationsSection } from "@/app/(platform)/team/[expertId]/components/ExpertIntegrationsSection/useExpertIntegrationsSection";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { formatCredentialName } from "@/components/contextual/IntegrationsPanel/helpers";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { IntegrationLogo } from "@/components/molecules/IntegrationLogo/IntegrationLogo";
import { cn } from "@/lib/utils";
import { useCopilotUIStore, type ContextPanelExpert } from "../../../../store";
import { StackSection } from "../../../WorkspaceFileCards/components/StackSection";
import { PanelEmptyState } from "../PanelEmptyState/PanelEmptyState";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

/** The chat's expert's integrations, laid out like the files tab: a titled
 *  card of rows, or an empty state that offers the first connection. Same
 *  add / use existing / remove actions as the expert's page. */
export function IntegrationsTab() {
  const expert = useCopilotUIStore((s) => s.contextPanelExpert);
  if (!expert) return null;

  return <IntegrationsTabContent expert={expert} />;
}

function IntegrationsTabContent({ expert }: { expert: ContextPanelExpert }) {
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
    isGrantableError,
    refetch,
  } = useExpertIntegrationsSection(expert.id);
  const groups = groupExpertIntegrations(granted);
  const canUseExisting = grantable.length > 0 && !isError && !isGrantableError;

  return (
    <div className="flex flex-col gap-6">
      {isGrantableError && !isError ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-warning-surface px-3 py-2 ring-1 ring-warning-border ring-inset">
          <Text tone="warning" variant="small">
            {t(
              "Couldn’t load your connected services, so “Use existing” is unavailable.",
              "无法加载你已连接的服务，因此“使用现有连接”暂不可用。",
            )}
          </Text>
          <Button
            variant="secondary"
            size="small"
            onClick={() => void refetch()}
          >
            {t("Retry", "重试")}
          </Button>
        </div>
      ) : null}
      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : isError ? (
        <ErrorCard
          context={t("this expert's integrations", "此专家的集成")}
          hint={t(
            "We could not load what this expert can reach.",
            "无法加载此专家可访问的服务。",
          )}
          onRetry={refetch}
        />
      ) : groups.length === 0 ? (
        <PanelEmptyState
          tiles={[
            <IntegrationLogo key="slack" provider="slack" size={24} />,
            <IntegrationLogo key="notion" provider="notion" size={24} />,
            <IntegrationLogo key="google" provider="google" size={24} />,
          ]}
          title={t("No integrations yet", "暂无集成")}
          description={t(
            `Connect a tool and ${expert.name} can use it on your behalf.`,
            `连接工具后，${expert.name} 就能代表你使用它。`,
          )}
          footer={<ExpertPageLink expert={expert} className="justify-center" />}
        >
          <Button
            variant="primary"
            size="small"
            leadingIcon={PlusSignIcon}
            onClick={openConnect}
          >
            {t("Add integration", "添加集成")}
          </Button>
          {canUseExisting && (
            <Button
              variant="secondary"
              size="small"
              leadingIcon={Share01Icon}
              onClick={openUseExisting}
            >
              {t("Use existing", "使用现有连接")}
            </Button>
          )}
        </PanelEmptyState>
      ) : (
        <StackSection
          title={t(`${expert.name}'s integrations`, `${expert.name} 的集成`)}
          icon={PlugSocketIcon}
          count={granted.length}
          action={
            <>
              {canUseExisting && (
                <Button
                  variant="ghost-subtle"
                  size="icon-2xs"
                  shape="soft"
                  withTooltip={false}
                  onClick={openUseExisting}
                  aria-label={t("Use existing", "使用现有连接")}
                >
                  <Icon icon={Share01Icon} size={14} />
                </Button>
              )}
              <Button
                variant="ghost-subtle"
                size="icon-2xs"
                shape="soft"
                withTooltip={false}
                onClick={openConnect}
                aria-label={t("Add integration", "添加集成")}
              >
                <Icon icon={PlusSignIcon} size={14} />
              </Button>
            </>
          }
        >
          <div className="-mx-3 grid divide-y divide-border-base/70">
            {groups.flatMap((group) =>
              group.integrations.map((integration) => (
                <IntegrationRow
                  key={integration.credential_id}
                  serviceName={group.name}
                  icon={group.icon}
                  integration={integration}
                  isRemoving={isRevoking}
                  onRemove={() => removeIntegration(integration.credential_id)}
                />
              )),
            )}
          </div>
          <div className="-mx-3 border-t border-border-base/70 px-3">
            <ExpertPageLink expert={expert} className="justify-between py-2" />
          </div>
        </StackSection>
      )}

      <UseExistingCredentialsDialog
        open={isUsingExisting}
        expertName={expert.name}
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
        expertName={expert.name}
        onClose={closeConnect}
        onConnected={(credential) => {
          connectCredential(credential);
          closeConnect();
        }}
      />
    </div>
  );
}

interface ExpertPageLinkProps {
  expert: ContextPanelExpert;
  className?: string;
}

function ExpertPageLink({ expert, className }: ExpertPageLinkProps) {
  const { t } = useTranslation();
  return (
    <Link
      href={`/team/${expert.id}`}
      className={cn(
        "flex items-center gap-1 text-body-sm leading-inherit font-medium text-foreground-body transition-colors hover:text-foreground-base",
        className,
      )}
    >
      {t(`Open ${expert.name}'s page`, `打开 ${expert.name} 的页面`)}
      <Icon icon={ArrowRight01Icon} size={14} aria-hidden />
    </Link>
  );
}

interface RowProps {
  serviceName: string;
  icon: string;
  integration: ExpertCredentialRef;
  isRemoving: boolean;
  onRemove: () => void;
}

/** A files-tab style row: logo tile, service and account, and a remove action
 *  that fades in on hover (always shown where there is no hover). */
function IntegrationRow({
  serviceName,
  icon,
  integration,
  isRemoving,
  onRemove,
}: RowProps) {
  const { t } = useTranslation();
  const name = formatCredentialName(integration.title, integration.provider);
  const typeLabel =
    integration.type === "api_key"
      ? t("API Key", "API 密钥")
      : integration.type === "user_password"
        ? t("Username & password", "用户名和密码")
        : integration.type === "host_scoped"
          ? t("Host", "主机")
          : integration.type === "device_code"
            ? t("Device auth", "设备授权")
            : (TYPE_LABELS[integration.type] ?? integration.type);

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-hover/70"
      data-testid="expert-integration-row"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-base bg-surface">
        <IntegrationLogo
          provider={icon}
          alt={t(`${serviceName} logo`, `${serviceName} 标志`)}
          size={20}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <Text
          tone="primary"
          variant="body-medium"
          as="span"
          className="truncate"
        >
          {serviceName}
        </Text>
        <Text tone="muted" variant="small" as="span" className="truncate">
          {name} · {typeLabel}
        </Text>
      </span>
      <span
        aria-hidden
        title={t("Ready", "就绪")}
        className="size-1.5 shrink-0 rounded-full bg-success"
      />
      <span className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 has-[:focus-visible]:opacity-100 [@media(hover:none)]:opacity-100">
        <Button
          variant="ghost-danger"
          size="icon-xs"
          shape="soft"
          withTooltip={false}
          onClick={onRemove}
          disabled={isRemoving}
          aria-busy={isRemoving}
          aria-label={t(`Remove ${name}`, `移除 ${name}`)}
        >
          <Icon
            icon={isRemoving ? Loading03Icon : Delete02Icon}
            size={14}
            spin={isRemoving}
          />
        </Button>
      </span>
    </div>
  );
}
