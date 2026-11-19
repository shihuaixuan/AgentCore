"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { connectionSearchText, type ExistingConnection } from "./helpers";
import { ConnectProviderRow } from "@/app/(platform)/copilot/components/ConnectToolsDialog/ConnectProviderRow";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  formatCredentialName,
  groupServiceIdentity,
  serviceIcon,
  serviceKey,
} from "@/components/contextual/IntegrationsPanel/helpers";
import type { ConnectableProvider } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/helpers";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { IntegrationLogo } from "@/components/molecules/IntegrationLogo/IntegrationLogo";
import { SearchInput } from "@/components/molecules/SearchInput/SearchInput";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useBottomScrollShadow } from "../../../components/SoulDrawer/useBottomScrollShadow";
import { useFitListToDialog } from "../useFitListToDialog";

interface Props {
  open: boolean;
  expertName: string;
  credentials: ExistingConnection[];
  isGranting: boolean;
  onUse: (credentialId: string) => void;
  onClose: () => void;
}

interface ProviderGroup {
  provider: ConnectableProvider;
  credentials: ExistingConnection[];
}

function groupByProvider(credentials: ExistingConnection[]): ProviderGroup[] {
  const groups = new Map<string, ExistingConnection[]>();
  for (const credential of credentials) {
    const id = serviceKey(credential);
    groups.set(id, [...(groups.get(id) ?? []), credential]);
  }
  return [...groups.entries()]
    .map(([id, list]) => {
      const { name, icon } = groupServiceIdentity(list);
      return {
        provider: {
          id,
          serviceId: id,
          name,
          supportedAuthTypes: [],
          iconId: icon,
        },
        credentials: list,
      };
    })
    .sort((a, b) => a.provider.name.localeCompare(b.provider.name));
}

/** Credentials already on your account that this expert cannot use yet,
 *  grouped like the connect picker. A provider with one credential grants
 *  on click; with several, a second step asks which one. */
export function UseExistingCredentialsDialog({
  open,
  expertName,
  credentials,
  isGranting,
  onUse,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { attachList, list } = useFitListToDialog<HTMLUListElement>();
  const hasMoreBelow = useBottomScrollShadow(list);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedProvider(null);
    }
  }, [open]);

  const needle = query.trim().toLowerCase();
  const groups = groupByProvider(credentials).filter(
    (group) =>
      !needle ||
      group.provider.name.toLowerCase().includes(needle) ||
      group.credentials.some((credential) =>
        connectionSearchText(credential).includes(needle),
      ),
  );
  const selected = groups.find(
    (group) => group.provider.id === selectedProvider,
  );

  function handleSelect(providerId: string) {
    const group = groups.find((item) => item.provider.id === providerId);
    if (!group) return;
    if (group.credentials.length === 1) {
      onUse(group.credentials[0].id);
      return;
    }
    setSelectedProvider(providerId);
  }

  return (
    <Dialog
      variant="compact"
      styling={{ maxWidth: "40rem", maxHeight: "60vh" }}
      title={t("Use an existing connection", "使用现有连接")}
      controlled={{
        isOpen: open,
        set: (next) => {
          if (!next) onClose();
        },
      }}
    >
      <Dialog.Content>
        <div className="-mb-2 flex flex-col gap-3">
          {selected ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="flex w-fit items-center gap-1 text-body text-foreground-tertiary hover:text-foreground-emphasis"
              >
                <Icon icon={ArrowLeft02Icon} size={14} />

                {t("All connections", "全部连接")}
              </button>
              <Text variant="body-tight" tone="muted">
                {t(
                  `You have ${selected.credentials.length} ${selected.provider.name} connections. Choose which one ${expertName} should use.`,
                  `你有 ${selected.credentials.length} 个 ${selected.provider.name} 连接。请选择供 ${expertName} 使用的连接。`,
                )}
              </Text>
              <ul
                className="flex flex-col gap-2"
                aria-label={t(
                  `${selected.provider.name} connections`,
                  `${selected.provider.name} 连接`,
                )}
              >
                {selected.credentials.map((credential) => {
                  const name = formatCredentialName(
                    credential.title ?? credential.provider,
                    credential.provider,
                  );
                  return (
                    <li
                      key={credential.id}
                      className="flex items-center gap-3 rounded-xl bg-surface-hover px-3 py-2.5"
                    >
                      <IntegrationLogo
                        provider={serviceIcon(credential)}
                        size={24}
                      />
                      <Text
                        variant="body-medium"
                        as="span"
                        tone="primary"
                        className="min-w-0 flex-1 truncate"
                      >
                        {name}
                      </Text>
                      <Button
                        variant="secondary"
                        size="small"
                        disabled={isGranting}
                        onClick={() => onUse(credential.id)}
                        aria-label={t(
                          `Let ${expertName} use ${name}`,
                          `允许 ${expertName} 使用 ${name}`,
                        )}
                      >
                        {t("Use", "使用")}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <Text variant="body-tight" tone="muted">
                {t(
                  `These connections are already set up on your account but ${expertName} can't use them yet. Choose one to give ${expertName} access. Nothing is re-authorised, and you can remove the access from this tab at any time.`,
                  `这些连接已在你的账户中设置，但 ${expertName} 尚无使用权限。选择一个连接以授予 ${expertName} 访问权限。无需重新授权，你可以随时在此标签页中移除访问权限。`,
                )}
              </Text>
              <SearchInput
                size="small"
                value={query}
                onChange={setQuery}
                placeholder={t("Search connections", "搜索连接")}
              />
              {credentials.some(
                (credential) => (credential.customConnections?.length ?? 0) > 1,
              ) && (
                <Text variant="small" tone="muted">
                  {t(
                    "Connections listed together share a credential. Adding or removing access applies to all of them.",
                    "合并列出的连接共用一份凭据，添加或移除权限将同时影响这些连接。",
                  )}
                </Text>
              )}
              {groups.length === 0 ? (
                <Text variant="small" tone="muted">
                  {credentials.length === 0
                    ? t(
                        "No available connections to add.",
                        "没有可添加的可用连接。",
                      )
                    : t("No connections match.", "没有匹配的连接。")}
                </Text>
              ) : (
                <div className="relative">
                  <ul
                    ref={attachList}
                    className="grid grid-cols-2 gap-2 overflow-y-auto pr-1"
                    aria-label={t("Existing connections", "现有连接")}
                  >
                    {groups.map((group) => (
                      <li key={group.provider.id}>
                        <ConnectProviderRow
                          provider={group.provider}
                          onSelect={handleSelect}
                          description={
                            group.credentials[0].customConnections
                              ? t("Custom MCP", "自定义 MCP")
                              : group.credentials.length === 1
                                ? formatCredentialName(
                                    group.credentials[0].title ??
                                      group.provider.name,
                                    group.credentials[0].provider,
                                  )
                                : t(
                                    `${group.credentials.length} connections · choose one`,
                                    `${group.credentials.length} 个连接 · 请选择一个`,
                                  )
                          }
                        />
                      </li>
                    ))}
                  </ul>

                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface to-transparent transition-opacity duration-200",

                      hasMoreBelow ? "opacity-100" : "opacity-0",
                    )}
                  />
                </div>
              )}
            </>
          )}
          <div className="flex justify-end pt-1">
            <Button variant="secondary" size="small" onClick={onClose}>
              {t("Cancel", "取消")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
