"use client";

import { useContext, useEffect, useId, useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { CatalogAccountPanel } from "@/components/contextual/IntegrationsPanel/components/CatalogAccounts/CatalogAccountPanel";
import { useCatalogAccounts } from "@/components/contextual/IntegrationsPanel/components/CatalogAccounts/useCatalogAccounts";
import { matchesDefinition, type CatalogMethod, type CatalogServer } from "@/lib/mcp-catalog-connections";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ChainActionsContext } from "../../../../components/ToolChain/chainActions";
import { useCopilotChatActions } from "../../../../components/CopilotChatActionsProvider/useCopilotChatActions";
import type { SetupRequirementsResponse } from "@/app/api/__generated__/models/setupRequirementsResponse";

export function CatalogAccountCard({output, server, connectorID, expertId, retryInstruction}: {output: SetupRequirementsResponse; server: CatalogServer & {methods: CatalogMethod[]}; connectorID: string; expertId?: string; retryInstruction?: string}) {
  const {t} = useTranslation();
  const chain = useContext(ChainActionsContext);
  const {onSend} = useCopilotChatActions();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>();
  const accounts = useCatalogAccounts(connectorID, expertId);
  const rejected = output.rejection?.credential_id;
  const rows = accounts.rows.filter((row) => matchesDefinition(row, server) && (!rejected || row.credential_id !== rejected));
  const eligible = rows.filter((row) => accounts.granted.includes(row.id));
  const ready = accounts.known && (selected ? eligible.some((row) => row.id === selected) : !output.rejection && eligible.length === 1);
  const grantable = accounts.known && rows.length === 1 && !eligible.length;
  const label = !accounts.known && !accounts.failed ? t("Checking accounts…", "正在检查账户…") : rows.length > 1 ? t("Choose account", "选择账户") : t("Connect", "连接");
  const {agent_name: service, agent_id: serverUrl} = output.setup_info;
  useEffect(() => {
    if (!chain) return;
    const show = () => setOpen(true);
    chain.register(id, {id, ready, buildMessage: () => null, mcp: {id, service, serverUrl, expertId, connected: ready, connectLabel: label, loading: false, granting: false, grantable, showManualToken: false, authScheme: "bearer", error: output.rejection?.detail ?? null, onConnect: show, onGrant: show, onUseToken: () => {}}});
    return () => chain.unregister(id);
  }, [chain, id, ready, service, serverUrl, expertId, label, grantable, output.rejection?.detail]);
  return <>
    {!chain && <Button variant="secondary" onClick={() => setOpen(true)}>{ready ? t(`Connected to ${service}.`, `已连接 ${service}。`) : grantable ? t("Grant access", "授予访问权限") : `${label} · ${service}`}</Button>}
    {open && <Dialog controlled={{isOpen: open, set: setOpen}} title={service}><Dialog.Content>
      <CatalogAccountPanel server={server} connectorID={connectorID} expertID={expertId} excludedID={rejected} onDone={(row) => {
        setSelected(row.id); setOpen(false);
        void onSend(`${retryInstruction ?? "Please retry."} Use connection_id ${JSON.stringify(row.id)}.`);
      }} />
    </Dialog.Content></Dialog>}
  </>;
}
