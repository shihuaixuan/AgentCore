"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { cn } from "@/lib/utils";

import { DeleteConfirmDialog } from "../DeleteConfirmDialog/DeleteConfirmDialog";
import { IntegrationsListEmpty } from "../IntegrationsListEmpty/IntegrationsListEmpty";
import { IntegrationsSearch } from "../IntegrationsSearch/IntegrationsSearch";
import { IntegrationsSelectionBar } from "../IntegrationsSelectionBar/IntegrationsSelectionBar";
import { ProviderGroup } from "../ProviderGroup/ProviderGroup";
import { IntegrationsListSkeleton } from "./IntegrationsListSkeleton";
import { useIntegrationsList } from "./useIntegrationsList";
import type { useCustomMCPConnections } from "../CustomMCPConnections/useCustomMCPConnections";
import { CustomMCPConnectionRow } from "../CustomMCPConnections/CustomMCPConnectionRow";
import { Text } from "@/components/atoms/Text/Text";

const LIST_CONTAINER_VARIANTS: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const LIST_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const REDUCED_MOTION_ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  /** Background for the sticky rows; it must match the surface below. */
  stickyClassName: string;
  customConnections?: ReturnType<typeof useCustomMCPConnections>;
}

export function IntegrationsList({
  query,
  onQueryChange: setQuery,
  stickyClassName,
  customConnections,
}: Props) {
  const { t } = useTranslation();
  const {
    providers,
    isLoading,
    isError,
    error,
    refetch,
    isEmpty,
    selection,
    requestDelete,
    isDeleting,
    isDeletingId,
    buildTargets,
  } = useIntegrationsList(
    query,
    new Set(
      customConnections?.connections.flatMap((connection) =>
        connection.credential_id ? [connection.credential_id] : [],
      ) ?? [],
    ),
  );
  const customRows = (customConnections?.connections ?? []).filter(
    (connection) =>
      `${connection.name} ${connection.description} ${connection.server_url} Custom MCP 自定义 MCP`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const reduceMotion = useReducedMotion();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [pendingForceIds, setPendingForceIds] = useState<string[]>([]);

  function askDelete(ids: string[]) {
    if (ids.length === 0) return;
    setPendingDeleteIds(ids);
  }

  async function confirmDelete() {
    const ids = pendingDeleteIds;
    setPendingDeleteIds([]);
    const { needsConfirmationIds } = await requestDelete(ids);
    if (needsConfirmationIds.length > 0) {
      setPendingForceIds(needsConfirmationIds);
    }
  }

  async function confirmForceDelete() {
    const ids = pendingForceIds;
    setPendingForceIds([]);
    await requestDelete(ids, true);
  }

  const pendingTargets = buildTargets(pendingDeleteIds);
  const pendingNames = pendingTargets.map((t) => t.name ?? t.provider);
  const pendingForceNames = buildTargets(pendingForceIds).map(
    (t) => t.name ?? t.provider,
  );
  // The generic warning talks about agents losing access, which is not what
  // removing a ChatGPT connection does: it stops new ChatGPT-backed chats and
  // leaves everything already said in them alone.
  const pendingNotice = pendingTargets.some((t) => t.provider === "codex")
    ? t(
        "New chats can no longer run on your ChatGPT plan — they fall back to the connection AutoGPT picks. Your chat history is kept, and your other integrations are unaffected.",
        "新聊天将无法再通过您的 ChatGPT 套餐运行，系统会改用 AutoGPT 选择的连接。聊天记录将保留，其他集成不受影响。",
      )
    : undefined;

  if (isLoading || customConnections?.isLoading) {
    return (
      <div className="flex w-full flex-col gap-3">
        <IntegrationsSearch value={query} onChange={setQuery} disabled />
        <IntegrationsListSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col gap-3">
        <IntegrationsSearch value={query} onChange={setQuery} disabled />
        <ErrorCard
          context="integrations"
          responseError={
            error instanceof Error ? { message: error.message } : undefined
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className={cn(
          "sticky top-0 z-10 -mx-1 px-1 pt-1 pb-1",
          stickyClassName,
        )}
      >
        <IntegrationsSearch value={query} onChange={setQuery} />
      </div>

      <AnimatePresence initial={false}>
        {selection.selectedCount > 0 && (
          <motion.div
            key="integrations-selection-bar"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0, marginBottom: -12 }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, height: "auto", marginBottom: 0 }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0, marginBottom: -12 }
            }
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className={cn(
              "sticky top-2 z-20 overflow-hidden sm:top-0",
              stickyClassName,
            )}
          >
            <IntegrationsSelectionBar
              selectedCount={selection.selectedCount}
              allSelected={selection.allSelected}
              onSelectAll={selection.selectAll}
              onDeselectAll={selection.clear}
              onDeleteSelected={() => askDelete(selection.selectedIds)}
              isDeleting={isDeleting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {customConnections?.listError && (
        <Text variant="small" role="alert">
          {t("Could not load custom connections.", "无法加载自定义连接。")}
        </Text>
      )}
      {isEmpty && customRows.length === 0 ? (
        <IntegrationsListEmpty query={query} />
      ) : (
        <motion.div
          className="flex flex-col gap-3 pb-4"
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "show"}
          variants={reduceMotion ? undefined : LIST_CONTAINER_VARIANTS}
        >
          {customRows.map((connection) => (
            <CustomMCPConnectionRow
              key={connection.id}
              connection={connection}
              onEdit={() => customConnections?.edit(connection)}
              onRemove={() => customConnections?.setPendingRemove(connection)}
              busy={customConnections?.busy ?? false}
            />
          ))}
          {providers.map((provider) => (
            <motion.div
              key={provider.id}
              variants={
                reduceMotion ? REDUCED_MOTION_ITEM_VARIANTS : LIST_ITEM_VARIANTS
              }
            >
              <ProviderGroup
                provider={provider}
                isSelected={selection.isSelected}
                onToggleSelected={selection.toggle}
                onDelete={(id) => askDelete([id])}
                isDeletingId={isDeletingId}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <DeleteConfirmDialog
        open={pendingDeleteIds.length > 0}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteIds([]);
        }}
        itemNames={pendingNames}
        notice={pendingNotice}
        isPending={isDeleting}
        onConfirm={confirmDelete}
      />

      <DeleteConfirmDialog
        variant="force"
        open={pendingForceIds.length > 0}
        onOpenChange={(open) => {
          if (!open) setPendingForceIds([]);
        }}
        itemNames={pendingForceNames}
        isPending={isDeleting}
        onConfirm={confirmForceDelete}
      />
    </div>
  );
}
