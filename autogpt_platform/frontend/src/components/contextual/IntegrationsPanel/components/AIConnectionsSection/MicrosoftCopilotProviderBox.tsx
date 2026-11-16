"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useState } from "react";
import { Text } from "@/components/atoms/Text/Text";
import { MicrosoftConnectionPanel } from "@/components/contextual/MicrosoftConnection/MicrosoftConnectionPanel";
import { useMicrosoftBrowserSignIn } from "@/components/contextual/MicrosoftConnection/useMicrosoftBrowserSignIn";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  MICROSOFT_BASE_SCOPES,
  MICROSOFT_COPILOT_SCOPES,
} from "@/lib/microsoft-setup";
import { ProviderBox } from "./ProviderBox";

interface Props {
  isLinked: boolean;
  onSuccess: () => void;
}

export function MicrosoftCopilotProviderBox({ isLinked, onSuccess }: Props) {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const { browserAvailable } = useMicrosoftBrowserSignIn();

  function handleDone() {
    setIsOpen(false);
    onSuccess();
  }

  const card = (
    <ProviderBox
      name="Microsoft 365 Copilot"
      logoSrc="/integrations/microsoft.webp"
      state={isLinked ? "connected" : "available"}
    />
  );

  if (isLinked) return card;

  return (
    <Dialog
      title={t("Connect Microsoft 365 Copilot", "连接 Microsoft 365 Copilot")}
      variant="compact"
      controlled={{ isOpen, set: setIsOpen }}
    >
      <Dialog.Trigger>{card}</Dialog.Trigger>
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <Text variant="small" as="p" tone="muted">
            {t(
              "Requires a paid Microsoft Copilot or Copilot Business add-on from your work or school organization. The included Microsoft 365 Copilot Chat does not qualify. Chats you run on Copilot are answered by Microsoft 365 Copilot itself, without AutoGPT's tools.",
              "需要工作或学校组织提供付费的 Microsoft Copilot 或 Copilot Business 附加订阅。随附的 Microsoft 365 Copilot Chat 不符合要求。通过 Copilot 进行的聊天由 Microsoft 365 Copilot 自身回答，不使用 AutoGPT 的工具。",
            )}
          </Text>
          <MicrosoftConnectionPanel
            browserAvailable={browserAvailable}
            scopes={[...MICROSOFT_BASE_SCOPES, ...MICROSOFT_COPILOT_SCOPES]}
            onDone={handleDone}
          />
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
