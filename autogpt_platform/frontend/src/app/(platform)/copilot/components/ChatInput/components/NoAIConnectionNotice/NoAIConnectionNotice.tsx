"use client";

import Link from "next/link";
import { Alert02Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/atoms/Icon/Icon";
import { AttentionCard } from "@/components/organisms/AttentionCard/AttentionCard";
import { cn } from "@/lib/utils";
import { SELF_HOSTED_MODELS_DOCS_URL } from "@/app/(platform)/copilot/helpers/reportedSendError";
import { useNoAIConnectionNotice } from "./useNoAIConnectionNotice";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  enabled: boolean;
  className?: string;
}

// Stays above the composer for as long as nothing can answer, so the fix is
// still on screen after any toast about a failed send has gone.
export function NoAIConnectionNotice({ enabled, className }: Props) {
  const { t } = useTranslation();
  const { hasNoConnection } = useNoAIConnectionNotice(enabled);
  if (!hasNoConnection) return null;

  return (
    <AttentionCard.Root
      variant="warning-strong"
      density="snug"
      role="status"
      aria-label={t("No AI connection", "未连接 AI 模型")}
      className={cn("mb-2 w-full", className)}
    >
      <AttentionCard.Row align="start">
        <AttentionCard.Icon nudge>
          <Icon icon={Alert02Icon} className="h-4 w-4" aria-hidden />
        </AttentionCard.Icon>
        <AttentionCard.Content asChild>
          <span>
            {t(
              "No AI model is connected, so chat can't answer yet. Whoever runs this server can add a model API key or a local model",
              "尚未连接 AI 模型，因此聊天暂时无法回复。服务器管理员可以添加模型 API 密钥或本地模型",
            )}{" "}
            <a
              href={SELF_HOSTED_MODELS_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              {t("(setup guide)", "（设置指南）")}
            </a>
            {t(
              ", or you can connect your own ChatGPT or Microsoft 365 Copilot plan in",
              "，或者你可以连接自己的 ChatGPT 或 Microsoft 365 Copilot 订阅，前往",
            )}{" "}
            <Link
              href="/settings/ai-connections"
              className="font-medium underline underline-offset-2"
            >
              {t("Settings → AI connections", "设置 → AI 连接")}
            </Link>
            .
          </span>
        </AttentionCard.Content>
      </AttentionCard.Row>
    </AttentionCard.Root>
  );
}
