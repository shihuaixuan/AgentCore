"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Expert } from "@/app/api/__generated__/models/expert";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { ExpertConnectServiceDialog } from "../../[expertId]/components/ExpertIntegrationsSection/ExpertConnectServiceDialog";
import { SetupNeededRow } from "./components/SetupNeededRow";
import { useSetupNeeded } from "./useSetupNeeded";

/** Everything still standing between the team's scheduled workflows and
 *  their schedules, one row per gap with the one action that closes it. */
export function SetupNeeded({ experts }: { experts: Expert[] }) {
  const { t } = useTranslation();
  const {
    items,
    expertTitle,
    isConnectable,
    connecting,
    connect,
    closeConnect,
    handleConnected,
    allow,
    isGranting,
  } = useSetupNeeded(experts);

  if (items.length === 0) return null;

  return (
    <section
      aria-label={t("Setup needed", "需要设置")}
      className="flex min-w-0 flex-col"
      data-testid="setup-needed"
    >
      <div className="mb-1.5 flex items-center gap-1.5 px-3.5">
        <span className="flex text-warning-foreground">
          <Icon icon={Alert01Icon} size={14} aria-hidden />
        </span>
        <Text variant="small-medium" as="h2" tone="body">
          {t(`Setup needed (${items.length})`, `需要设置（${items.length}）`)}
        </Text>
      </div>
      <ul
        className="flex flex-col gap-2"
        aria-label={t("Setup items", "设置项目")}
      >
        {items.map((item) => (
          <li
            key={`${item.expert_id}-${item.workflow_id}-${item.providers.join("+")}`}
          >
            <SetupNeededRow
              item={item}
              expertTitle={expertTitle(item.expert_id)}
              isConnectable={isConnectable(item)}
              isGranting={isGranting}
              onConnect={() => connect(item)}
              onAllow={() => allow(item)}
            />
          </li>
        ))}
      </ul>
      {connecting ? (
        <ExpertConnectServiceDialog
          open
          expertName={expertTitle(connecting.expert_id)}
          initialProviderId={connecting.providers[0] ?? null}
          onClose={closeConnect}
          onConnected={handleConnected}
        />
      ) : null}
    </section>
  );
}
