"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { isConnectionEnabled, type GrantedConnection } from "./helpers";
import { CustomConnectionDetails } from "./CustomConnectionDetails";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  formatCredentialName,
  groupServiceIdentity,
  serviceKey,
} from "@/components/contextual/IntegrationsPanel/helpers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/molecules/Accordion/Accordion";
import { IntegrationLogo } from "@/components/molecules/IntegrationLogo/IntegrationLogo";
import { Delete02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export const TYPE_LABELS: Record<string, string> = {
  api_key: "API Key",
  oauth2: "OAuth",
  user_password: "Username & password",
  host_scoped: "Host",
  device_code: "Device auth",
};

const CONNECTION_LABELS: Record<string, string> = {
  api_key: "API key configured",
  oauth2: "Connected via OAuth",
  user_password: "Username/password set",
  host_scoped: "Host configured",
  device_code: "Connected via device auth",
};

const TYPE_LABELS_ZH: Record<string, string> = {
  api_key: "API 密钥",
  oauth2: "OAuth",
  user_password: "用户名和密码",
  host_scoped: "主机",
  device_code: "设备授权",
};

const CONNECTION_LABELS_ZH: Record<string, string> = {
  api_key: "已配置 API 密钥",
  oauth2: "已通过 OAuth 连接",
  user_password: "已设置用户名和密码",
  host_scoped: "已配置主机",
  device_code: "已通过设备授权连接",
};

const CONTAINER_VARIANTS: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};
const REDUCED_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

interface Group {
  id: string;
  name: string;
  icon: string;
  integrations: GrantedConnection[];
}

export function groupExpertIntegrations(
  integrations: GrantedConnection[],
): Group[] {
  const byService = new Map<string, GrantedConnection[]>();
  for (const integration of integrations) {
    const id = serviceKey(integration);
    byService.set(id, [...(byService.get(id) ?? []), integration]);
  }
  return [...byService.entries()]
    .map(([id, list]) => ({
      id,
      ...groupServiceIdentity(list),
      integrations: list,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface Props {
  integrations: GrantedConnection[];
  isRemoving: boolean;
  onRemove: (credentialId: string) => void;
}

export function ExpertIntegrationGroups({
  integrations,
  isRemoving,
  onRemove,
}: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const groups = groupExpertIntegrations(integrations);

  return (
    <motion.div
      className="flex flex-col gap-2.5"
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="show"
    >
      {groups.map((group) => (
        <motion.div
          key={group.id}
          variants={reduceMotion ? REDUCED_ITEM_VARIANTS : ITEM_VARIANTS}
          // ui/accordion's content wrapper sets text-sm, which the profile tab
          // ran at 15px/1.5rem; its slot takes the same size here.
          className="overflow-hidden rounded-2xl bg-surface smooth-shadow-ring-sm [&_[data-slot=accordion-panel]]:text-body-md"
        >
          <Accordion
            type="single"
            collapsible
            defaultValue={group.id}
            className="w-full"
          >
            {/* oxlint-disable-next-line design-system/no-restyle -- AccordionItem has no borderless variant (src/components is P9's) */}
            <AccordionItem value={group.id} className="border-b-0">
              <AccordionTrigger
                textSize="body-md"
                // oxlint-disable-next-line design-system/no-restyle -- AccordionTrigger has no compact card variant (src/components is P9's)
                className="px-3 py-2.5 pr-4 hover:no-underline [&>svg]:size-4 [&>svg]:text-foreground-tertiary"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex shrink-0 overflow-hidden rounded-full bg-surface">
                    <IntegrationLogo
                      provider={group.icon}
                      alt={t(`${group.name} logo`, `${group.name} 标志`)}
                      size={20}
                    />
                  </span>
                  <Text variant="body-md-medium" as="span" tone="primary">
                    {group.name}
                  </Text>
                  <span className="inline-flex items-center justify-center rounded-md bg-surface-hover px-1.5 py-0.5 font-sans text-caption font-medium text-foreground-secondary tabular-nums">
                    {group.integrations.length}
                  </span>
                </div>
              </AccordionTrigger>
              {/* oxlint-disable-next-line design-system/no-restyle -- AccordionContent has no flush variant (src/components is P9's) */}
              <AccordionContent className="px-0 pt-0 pb-0">
                <div className="flex flex-col divide-y divide-separator border-t border-border-base">
                  {group.integrations.map((integration) => (
                    <ExpertIntegrationRow
                      key={integration.credential_id}
                      integration={integration}
                      isRemoving={isRemoving}
                      onRemove={() => onRemove(integration.credential_id)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      ))}
    </motion.div>
  );
}

interface RowProps {
  integration: GrantedConnection;
  isRemoving: boolean;
  onRemove: () => void;
}

function ExpertIntegrationRow({ integration, isRemoving, onRemove }: RowProps) {
  const { t } = useTranslation();
  const name = integration.customConnections
    ? integration.title
    : formatCredentialName(integration.title, integration.provider);
  return (
    <div
      className="flex w-full items-center justify-between py-2.5 pr-4 pl-3"
      data-testid="expert-integration-row"
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <Text variant="body-md-medium" as="span" tone="primary">
            {name}
          </Text>
          <span className="inline-flex items-center justify-center rounded-md bg-surface-hover px-1.5 py-0.5 font-sans text-caption leading-4 text-foreground-secondary">
            {integration.customConnections
              ? t("Custom MCP", "自定义 MCP")
              : t(
                  TYPE_LABELS[integration.type] ?? integration.type,
                  TYPE_LABELS_ZH[integration.type] ?? integration.type,
                )}
          </span>
        </div>
        {integration.customConnections ? (
          <CustomConnectionDetails
            connections={integration.customConnections}
          />
        ) : (
          <Text variant="body-md" as="span" tone="muted">
            {t(
              CONNECTION_LABELS[integration.type] ?? "Configured",
              CONNECTION_LABELS_ZH[integration.type] ?? "已配置",
            )}
          </Text>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Text
          variant="eyebrow"
          tone={isConnectionEnabled(integration) ? "success" : "muted"}
        >
          {isConnectionEnabled(integration)
            ? t("Ready", "就绪")
            : t("Disabled", "已禁用")}
        </Text>
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          aria-busy={isRemoving}
          aria-label={t(`Remove ${name}`, `移除 ${name}`)}
          className="inline-flex size-7 items-center justify-center rounded-md text-foreground-tertiary transition-colors hover:bg-surface-hover hover:text-error focus-visible:ring-1 focus-visible:ring-foreground-subtle focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRemoving ? (
            <span className="inline-flex animate-spin">
              <Icon icon={Loading03Icon} size={16} />
            </span>
          ) : (
            <Icon icon={Delete02Icon} size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
