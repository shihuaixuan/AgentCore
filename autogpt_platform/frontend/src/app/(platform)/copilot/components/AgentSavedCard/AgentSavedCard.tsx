"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import Image from "next/image";
import sparklesImg from "./assets/sparkles.png";
import { useCopilotChatActions } from "../CopilotChatActionsProvider/useCopilotChatActions";
import { BookOpen01Icon, PencilIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  agentName: string;
  message: string;
  libraryAgentLink: string;
  agentPageLink: string;
}

export function AgentSavedCard({
  agentName,
  message,
  libraryAgentLink,
  agentPageLink,
}: Props) {
  const { t } = useTranslation();
  // On the in-builder chat panel the user is already looking at the agent
  // and the panel auto-switches the URL to the new version — the two
  // "Open in …" CTAs here would open the same agent in a second tab,
  // which is confusing. Keep the status line; hide the buttons.
  const { chatSurface } = useCopilotChatActions();
  const hideNavButtons = chatSurface === "builder";

  return (
    <div className="rounded-xl border border-border-base/60 bg-surface p-4 shadow-sm">
      <div className="flex items-baseline gap-2">
        <Image
          src={sparklesImg}
          alt={t("sparkles", "闪光")}
          width={24}
          height={24}
          className="relative top-1"
        />
        <Text variant="large-medium" className="mb-2 leading-inherit">
          {t("Workflow", "工作流")}{" "}
          <span className="text-brand">{agentName}</span> {message}
        </Text>
      </div>
      {!hideNavButtons && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="small"
            as="NextLink"
            href={libraryAgentLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon icon={BookOpen01Icon} size={14} />
            {t("Open in library", "在工作流库中打开")}
          </Button>
          <Button
            as="NextLink"
            variant="secondary"
            size="small"
            href={agentPageLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon icon={PencilIcon} size={14} />
            {t("Open in builder", "在构建器中打开")}
          </Button>
        </div>
      )}
    </div>
  );
}
