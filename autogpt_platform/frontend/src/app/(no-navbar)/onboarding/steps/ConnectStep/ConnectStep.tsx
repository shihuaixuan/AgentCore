"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { FadeIn } from "@/components/atoms/FadeIn/FadeIn";
import { Text } from "@/components/atoms/Text/Text";
import { AutopilotAvatar } from "@/components/molecules/AutopilotAvatar/AutopilotAvatar";
import { MicrosoftCopilotProviderBox } from "@/components/contextual/IntegrationsPanel/components/AIConnectionsSection/MicrosoftCopilotProviderBox";
import { UpcomingProviderBoxes } from "@/components/contextual/IntegrationsPanel/components/AIConnectionsSection/UpcomingProviderBoxes";
import { ProviderBox } from "@/components/contextual/IntegrationsPanel/components/AIConnectionsSection/ProviderBox";
import { useConnectStep } from "./useConnectStep";

/**
 * The last thing a self-host install asks for: a model to run on.
 *
 * The zero-config path (link the ChatGPT plan you already pay for) leads;
 * API keys are the advanced path and live in Settings. Deliberately
 * skippable so a user with keys is not blocked by a wizard.
 */
export function ConnectStep() {
  const { t } = useTranslation();
  const {
    connect,
    finishConnection,
    isConnecting,
    skip,
    isChatGPTLinked,
    isMicrosoftLinked,
  } = useConnectStep();

  return (
    <FadeIn>
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <AutopilotAvatar size={120} transparent />
          <Text variant="h4" as="h1">
            {t(
              "Already paying for an AI subscription?",
              "已经订阅了 AI 服务？",
            )}
          </Text>
          <Text variant="large" as="p" tone="muted" className="max-w-md">
            {t(
              "Connect it for AutoGPT chats. No API keys, no billing setup.",
              "连接后即可与 Otto 聊天，无需 API 密钥或设置账单。",
            )}
          </Text>
        </div>

        <div
          className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4"
          aria-label={t("Subscriptions", "订阅服务")}
        >
          <ProviderBox
            name="ChatGPT"
            logoSrc="/integrations/openai.png"
            state={isChatGPTLinked ? "connected" : "available"}
            isBusy={isConnecting}
            onClick={connect}
          />
          <MicrosoftCopilotProviderBox
            isLinked={isMicrosoftLinked}
            onSuccess={finishConnection}
          />
          <UpcomingProviderBoxes />
        </div>

        {isMicrosoftLinked && (
          <Text variant="small" as="p" tone="muted" className="text-center">
            {t(
              "Your Microsoft 365 Copilot is connected. It can answer chats but does not run AutoGPT tools.",
              "已连接 Microsoft 365 Copilot。它可以回复聊天，但不能运行 AutoGPT 工具。",
            )}
          </Text>
        )}

        <Button size="small" onClick={skip} className="h-10 w-56">
          {t("Next", "下一步")}
        </Button>
      </div>
    </FadeIn>
  );
}
