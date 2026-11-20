"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useEffect } from "react";
import { environment } from "@/services/environment";

import { MemoryLearningSection } from "./components/MemoryLearningSection";
import { UnavailableMemorySettings } from "./components/UnavailableMemorySettings";
import { EraseMemoryCard } from "./components/EraseMemoryCard";
import { MemoryChatPanel } from "./components/MemoryChatPanel/MemoryChatPanel";
import { useMemoryChatPanel } from "./components/MemoryChatPanel/useMemoryChatPanel";
import { RecentMemoriesCard } from "./components/RecentMemoriesCard";
import { ScopeCard } from "./components/ScopeCard";
import { SummaryCard } from "./components/SummaryCard";
import { UnderstandingCard } from "./components/UnderstandingCard/UnderstandingCard";
import { useLearningHistory } from "./useLearningHistory";
import { useMemoryPage } from "./useMemoryPage";

export default function SettingsMemoryPage() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t("Memory – Duanmu Software", "记忆 – 端木软件");
  }, [t]);

  if (!environment.isGraphMemoryAvailable()) {
    return <UnavailableMemorySettings />;
  }

  return <MemorySettings />;
}

function MemorySettings() {
  const { t } = useTranslation();
  const {
    scopeExpertID,
    selectScope,
    experts,
    scopeName,
    facts,
    isLoadingFacts,
    isFactsError,
    factsError,
    refetchFacts,
    memoryCount,
    forgetFact,
    forgettingUuid,
    eraseScope,
    isErasing,
  } = useMemoryPage();

  const chatPanel = useMemoryChatPanel({ scopeExpertID });
  const learning = useLearningHistory(scopeExpertID);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex min-w-0 flex-col pb-2 pl-4">
        <Text variant="h4" as="h1">
          {t("Memory", "记忆")}
        </Text>
        <Text variant="body" tone="body" className="mt-4 max-w-[600px]">
          {t(
            "What AutoGPT remembers about you — and who remembers it.",
            "AutoGPT 记住了你的哪些信息，以及由谁记住。",
          )}
        </Text>
      </header>

      <ScopeCard
        scopeExpertID={scopeExpertID}
        experts={experts}
        onSelect={selectScope}
      />

      <SummaryCard
        scopeExpertID={scopeExpertID}
        scopeName={scopeName}
        onViewSummary={() => void chatPanel.openWithSeed("summary")}
      />

      {scopeExpertID === null ? <UnderstandingCard /> : null}

      {isFactsError ? (
        <ErrorCard
          responseError={factsError || undefined}
          context={t("memory", "记忆")}
          onRetry={refetchFacts}
        />
      ) : (
        <RecentMemoriesCard
          facts={facts}
          isLoading={isLoadingFacts}
          forgettingUuid={forgettingUuid}
          onForget={forgetFact}
          onForgetTopic={() => void chatPanel.openWithSeed("forget")}
        />
      )}

      <MemoryLearningSection learning={learning} experts={experts} />

      <EraseMemoryCard
        scopeName={scopeName}
        memoryCount={memoryCount}
        isErasing={isErasing}
        onErase={eraseScope}
      />

      <MemoryChatPanel
        scopeName={scopeName}
        isOpen={chatPanel.isOpen}
        isStarting={chatPanel.isStarting}
        startError={chatPanel.startError}
        sessionId={chatPanel.sessionId}
        messages={chatPanel.messages}
        status={chatPanel.status}
        error={chatPanel.error}
        queuedMessages={chatPanel.queuedMessages}
        isTurnSettling={chatPanel.isTurnSettling}
        onSend={chatPanel.onSend}
        onStop={chatPanel.stop}
        onRetry={chatPanel.retryStart}
        onClose={chatPanel.close}
      />
    </div>
  );
}
