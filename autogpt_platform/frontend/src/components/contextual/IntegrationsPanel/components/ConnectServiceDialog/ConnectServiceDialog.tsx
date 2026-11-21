"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useContext } from "react";
import { CatalogAccountScope } from "../CatalogAccounts/CatalogAccountScope";
import type { CatalogAccount } from "@/lib/mcp-catalog-connections";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";

import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";

import { ListLoading, ListView } from "./components/ListView";
import { DetailView } from "./components/DetailView/DetailView";
import { useConnectServiceDialog } from "./useConnectServiceDialog";
import { useMeasuredHeight } from "./useMeasuredHeight";

interface Props {
  expertID?: string;
  onAccount?: (row: CatalogAccount) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: string;
  onConnected?: (credential: CredentialsMetaResponse) => void;
  initialProviderId?: string | null;
  /** Opens with the service search already filled in. */
  initialQuery?: string;
  preferMcp?: boolean;
}

const DEFAULT_TITLE = "Connect a service";
const DEFAULT_DESCRIPTION =
  "Choose a service to connect your account or view its setup instructions.";

const TRANSITION = { duration: 0.15, ease: [0, 0, 0.2, 1] as const };
const HEIGHT_TRANSITION = {
  duration: 0.2,
  ease: [0, 0, 0.2, 1] as const,
};

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

export function ConnectServiceDialog({
  expertID,
  onAccount,
  open,
  onOpenChange,
  title,
  description,
  onConnected,
  initialProviderId,
  initialQuery,
  preferMcp,
}: Props) {
  const { t } = useTranslation();
  const parent = useContext(CatalogAccountScope);
  const {
    query,
    setQuery,
    providers,
    popular,
    isLoading,
    isError,
    error,
    refetch,
    view,
    direction,
    selectedProvider,
    handleSelect,
    handleBack,
    handleSuccess,
  } = useConnectServiceDialog({
    open,
    onOpenChange,
    onConnected,
    initialProviderId,
    initialQuery,
  });

  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? reducedVariants : stepVariants;
  const [contentRef, contentHeight] = useMeasuredHeight<HTMLDivElement>();

  return (
    <CatalogAccountScope.Provider value={{expertID: expertID ?? parent.expertID, onAccount: (row) => { (onAccount ?? parent.onAccount)?.(row); onOpenChange(false); }}}>
    <Dialog
      title={title ?? t(DEFAULT_TITLE, "连接服务")}
      styling={{ maxWidth: "40rem" }}
      controlled={{
        isOpen: open,
        set: (next) => onOpenChange(next),
      }}
    >
      <Dialog.Content>
        <MotionConfig transition={TRANSITION}>
          <motion.div
            className="relative overflow-hidden px-2"
            animate={{ height: contentHeight ?? "auto" }}
            transition={reduceMotion ? { duration: 0 } : HEIGHT_TRANSITION}
          >
            <div ref={contentRef}>
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                {view === "list" ? (
                  <motion.div
                    key="list"
                    custom={direction}
                    variants={variants}
                    initial="initial"
                    animate="active"
                    exit="exit"
                  >
                    {isLoading ? (
                      <ListLoading />
                    ) : isError ? (
                      <ErrorCard
                        context="providers"
                        responseError={
                          error instanceof Error
                            ? { message: error.message }
                            : undefined
                        }
                        onRetry={() => refetch()}
                      />
                    ) : (
                      <ListView
                        query={query}
                        setQuery={setQuery}
                        providers={providers}
                        popular={popular}
                        onSelect={handleSelect}
                        description={
                          description ??
                          t(
                            DEFAULT_DESCRIPTION,
                            "选择服务以连接账户或查看设置说明。",
                          )
                        }
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`detail-${selectedProvider?.id}`}
                    custom={direction}
                    variants={variants}
                    initial="initial"
                    animate="active"
                    exit="exit"
                  >
                    <DetailView
                      provider={selectedProvider!}
                      onBack={handleBack}
                      onSuccess={handleSuccess}
                      preferMcp={preferMcp}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </MotionConfig>
      </Dialog.Content>
    </Dialog>
    </CatalogAccountScope.Provider>
  );
}
