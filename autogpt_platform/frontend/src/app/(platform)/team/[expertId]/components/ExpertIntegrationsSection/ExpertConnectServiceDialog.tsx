"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { ConnectProviderRow } from "@/app/(platform)/copilot/components/ConnectToolsDialog/ConnectProviderRow";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { ConnectMethodView } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/components/ConnectMethodView/ConnectMethodView";
import { SearchInput } from "@/components/molecules/SearchInput/SearchInput";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { cn } from "@/lib/utils";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useMeasuredHeight } from "@/components/contextual/IntegrationsPanel/components/ConnectServiceDialog/useMeasuredHeight";
import { Plug01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useBottomScrollShadow } from "../../../components/SoulDrawer/useBottomScrollShadow";
import { useFitListToDialog } from "../useFitListToDialog";
import {
  SERVICE_FILTERS,
  useExpertConnectServiceDialog,
} from "./useExpertConnectServiceDialog";

const STEP_TRANSITION = { duration: 0.15, ease: [0, 0, 0.2, 1] as const };
const HEIGHT_TRANSITION = { duration: 0.2, ease: [0, 0, 0.2, 1] as const };

const stepVariants = {
  initial: (direction: number) => ({ x: 16 * direction, opacity: 0 }),
  active: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: -16 * direction, opacity: 0 }),
};

const reducedVariants = {
  initial: { opacity: 0 },
  active: { opacity: 1 },
  exit: { opacity: 0 },
};

interface Props {
  open: boolean;
  expertName: string;
  /** Open straight on this provider's connect step instead of the picker. */
  initialProviderId?: string | null;
  onClose: () => void;
  onConnected: (credential: CredentialsMetaResponse) => void;
}

/** The welcome dialog's "Connect your tools" panel, minus the recommendations:
 *  every service is listed, and a successful connect hands the credential
 *  back so the expert is granted it. */
export function ExpertConnectServiceDialog({
  open,
  expertName,
  initialProviderId,
  onClose,
  onConnected,
}: Props) {
  const { t } = useTranslation();
  const {
    query,
    setQuery,
    filter,
    setFilter,
    providers,
    isLoading,
    isError,
    refetch,
    selectedProvider,
    direction,
    connectedServices,
    selectedMethod,
    setSelectedMethod,
    showNative,
    setShowNative,
    isMcpStep,
    apiKeyForm,
    handleApiKeySubmit,
    showContinue,
    isContinueDisabled,
    isConnecting,
    handleSelect,
    handleBackToList,
    handleContinue,
    handleSuccess,
  } = useExpertConnectServiceDialog({ open, initialProviderId, onConnected });
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? reducedVariants : stepVariants;
  const [contentRef, contentHeight] = useMeasuredHeight<HTMLDivElement>();
  const { attachList, list } = useFitListToDialog<HTMLUListElement>();
  const hasMoreBelow = useBottomScrollShadow(list);

  return (
    <Dialog
      variant="compact"
      styling={{ maxWidth: "40rem", maxHeight: "85vh" }}
      controlled={{
        isOpen: open,
        set: (next) => {
          if (!next && !isConnecting) onClose();
        },
      }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <motion.div
            className="relative -m-1 overflow-hidden"
            animate={{ height: contentHeight ?? "auto" }}
            transition={reduceMotion ? { duration: 0 } : HEIGHT_TRANSITION}
          >
            <div ref={contentRef} className="p-1">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                {selectedProvider ? (
                  <motion.div
                    key={`detail-${selectedProvider.id}`}
                    custom={direction}
                    variants={variants}
                    initial="initial"
                    animate="active"
                    exit="exit"
                    transition={STEP_TRANSITION}
                  >
                    <ConnectMethodView
                      provider={selectedProvider}
                      selectedMethod={selectedMethod}
                      onSelectMethod={setSelectedMethod}
                      apiKeyForm={apiKeyForm}
                      onApiKeySubmit={handleApiKeySubmit}
                      onInlineConnectSuccess={handleSuccess}
                      mcpSignIn={{
                        showNative,
                        onShowNativeChange: setShowNative,
                        onBack: handleBackToList,
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    custom={direction}
                    variants={variants}
                    initial="initial"
                    animate="active"
                    exit="exit"
                    transition={STEP_TRANSITION}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <Text variant="lead-medium" as="h3" tone="primary">
                        {t(
                          `Connect a service for ${expertName}`,
                          `为 ${expertName} 连接服务`,
                        )}
                      </Text>
                      <Text variant="small" tone="muted">
                        {t("Pick a service to connect.", "选择要连接的服务。")}{" "}
                        {t(
                          `${expertName} will be able to use it on your behalf.`,
                          `${expertName} 将可以代你使用此服务。`,
                        )}
                      </Text>
                    </div>
                    {isLoading ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map((row) => (
                          <Skeleton
                            key={row}
                            className="h-14 w-full rounded-xl"
                          />
                        ))}
                      </div>
                    ) : isError ? (
                      <ErrorCard
                        context={t("services", "服务")}
                        hint={t(
                          "We could not load the services you can connect.",
                          "无法加载可连接的服务。",
                        )}
                        onRetry={() => refetch()}
                      />
                    ) : (
                      <div className="flex flex-col gap-3">
                        <SearchInput
                          size="small"
                          value={query}
                          onChange={setQuery}
                          placeholder={t("Search services...", "搜索服务…")}
                          aria-label={t("Search services", "搜索服务")}
                        />
                        <div
                          role="group"
                          aria-label={t("Filter services", "筛选服务")}
                          className="flex items-center gap-1"
                        >
                          {SERVICE_FILTERS.map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              variant="toggle"
                              size="small"
                              aria-pressed={filter === option.value}
                              onClick={() => setFilter(option.value)}
                            >
                              {t(option.label, option.zh)}
                            </Button>
                          ))}
                        </div>
                        {providers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-base py-8 text-center">
                            <span className="inline-flex text-foreground-tertiary">
                              <Icon icon={Plug01Icon} size={24} />
                            </span>
                            <Text variant="body" tone="secondary">
                              {query.trim()
                                ? t(
                                    `No services match "${query.trim()}"`,
                                    `没有与“${query.trim()}”匹配的服务`,
                                  )
                                : filter === "connected"
                                  ? t(
                                      "No services connected yet.",
                                      "尚未连接任何服务。",
                                    )
                                  : t(
                                      "No services available.",
                                      "暂无可用服务。",
                                    )}
                            </Text>
                          </div>
                        ) : (
                          <div className="relative">
                            <ul
                              ref={attachList}
                              className="grid grid-cols-2 gap-2 overflow-y-auto pr-1"
                              aria-label={t("Services", "服务")}
                            >
                              {providers.map((provider) => (
                                <li key={provider.id}>
                                  <ConnectProviderRow
                                    provider={provider}
                                    className="rounded-lg"
                                    onSelect={handleSelect}
                                    isConnected={connectedServices.has(
                                      provider.serviceId,
                                    )}
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
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {isMcpStep ? null : (
            <div className="flex items-center justify-end gap-3">
              {selectedProvider ? (
                <>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleBackToList}
                  >
                    {t("Back", "返回")}
                  </Button>
                  {showContinue ? (
                    <Button
                      variant="primary"
                      size="small"
                      disabled={isContinueDisabled}
                      loading={isConnecting}
                      onClick={handleContinue}
                    >
                      {isConnecting
                        ? t("Connecting…", "正在连接…")
                        : t("Continue", "继续")}
                    </Button>
                  ) : null}
                </>
              ) : (
                <Button variant="secondary" size="small" onClick={onClose}>
                  {t("Cancel", "取消")}
                </Button>
              )}
            </div>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
