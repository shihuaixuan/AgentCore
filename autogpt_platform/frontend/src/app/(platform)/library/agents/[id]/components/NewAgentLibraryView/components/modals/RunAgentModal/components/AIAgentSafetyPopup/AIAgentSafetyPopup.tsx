"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { Key, storage } from "@/services/storage/local-storage";
import { useCallback, useEffect, useState } from "react";
import { SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  agentId: string;
  onAcknowledge: () => void;
  isOpen: boolean;
}

export function AIAgentSafetyPopup({ agentId, onAcknowledge, isOpen }: Props) {
  const { t } = useTranslation();
  function handleAcknowledge() {
    // Add this agent to the list of agents for which popup has been shown
    const seenAgentsJson = storage.get(Key.AI_AGENT_SAFETY_POPUP_SHOWN);
    const seenAgents: string[] = seenAgentsJson
      ? JSON.parse(seenAgentsJson)
      : [];

    if (!seenAgents.includes(agentId)) {
      seenAgents.push(agentId);
      storage.set(Key.AI_AGENT_SAFETY_POPUP_SHOWN, JSON.stringify(seenAgents));
    }

    onAcknowledge();
  }

  if (!isOpen) return null;

  return (
    <Dialog
      title={t("Safety Checks", "安全检查")}
      controlled={{ isOpen, set: () => {} }}
      styling={{ maxWidth: "480px" }}
    >
      <Dialog.Content>
        <div className="flex flex-col items-center p-6 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-info-surface text-info-foreground">
            <Icon icon={SecurityCheckIcon} size={32} />
          </div>

          <Text variant="h3" className="mb-4">
            {t("Safety Checks Enabled", "已启用安全检查")}
          </Text>

          <Text variant="body" tone="body" className="mb-2">
            {t(
              "AI-generated workflows may take actions that affect your data or external systems.",
              "AI 生成的工作流可能执行影响你的数据或外部系统的操作。",
            )}
          </Text>

          <Text variant="body" tone="body" className="mb-8">
            {t(
              "AutoGPT includes safety checks so you'll always have the opportunity to review and approve sensitive actions before they happen.",
              "AutoGPT 内置安全检查，确保你始终能在敏感操作执行前进行审核和批准。",
            )}
          </Text>

          <Button
            variant="primary"
            size="large"
            className="w-full"
            onClick={handleAcknowledge}
          >
            {t("Got it", "知道了")}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

export function useAIAgentSafetyPopup(
  agentId: string,
  hasSensitiveAction: boolean,
  hasHumanInTheLoop: boolean,
) {
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (hasChecked) return;

    const seenAgentsJson = storage.get(Key.AI_AGENT_SAFETY_POPUP_SHOWN);
    const seenAgents: string[] = seenAgentsJson
      ? JSON.parse(seenAgentsJson)
      : [];
    const hasSeenPopupForThisAgent = seenAgents.includes(agentId);
    const isRelevantAgent = hasSensitiveAction || hasHumanInTheLoop;

    setShouldShowPopup(!hasSeenPopupForThisAgent && isRelevantAgent);
    setHasChecked(true);
  }, [agentId, hasSensitiveAction, hasHumanInTheLoop, hasChecked]);

  const dismissPopup = useCallback(() => {
    setShouldShowPopup(false);
  }, []);

  return {
    shouldShowPopup,
    dismissPopup,
  };
}
