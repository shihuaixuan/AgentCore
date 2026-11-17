"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { AuthCard } from "@/components/auth/AuthCard";
import { LinkType } from "@/app/api/__generated__/models/linkType";
import { isUserLink } from "../helpers";
import {
  ArrowTurnBackwardIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  linkType: LinkType;
  platform: string;
  serverName: string | null;
  serverNoun: string;
  returnUrl: string | null;
}

export function SuccessView({
  linkType,
  platform,
  serverName,
  serverNoun,
  returnUrl,
}: Props) {
  const { t } = useTranslation();
  const forUser = isUserLink(linkType);
  const label =
    forUser || !serverName ? `your ${platform} account` : serverName;
  const detail = forUser
    ? `You can now chat with AutoGPT in your ${platform} DMs.`
    : `Everyone in the ${serverNoun} can start using AutoGPT right away.`;

  return (
    <AuthCard
      title={t("AutoGPT is ready!", "AutoGPT 已准备就绪！")}
      // oxlint-disable-next-line design-system/no-restyle -- AuthCard has no roomy size; keeps today's p-8 padding and gap-6
      className="max-w-[38rem] gap-6 p-8"
    >
      <div className="flex w-full flex-col items-center gap-7">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-surface text-success">
          <Icon icon={CheckmarkCircle02Icon} size={40} />
        </div>

        <div className="w-full rounded-xl bg-surface-hover px-6 py-5 text-center">
          <Text variant="body-medium" tone="muted">
            {t(
              `${label} is now connected to your AutoGPT account.`,
              `${forUser || !serverName ? platform + " 账户" : serverName}现已连接到你的 AutoGPT 账户。`,
            )}
            <br />
            {t(
              detail,
              forUser
                ? `现在可以在 ${platform} 私信中与 Otto 聊天。`
                : "共享空间中的所有成员现在都可以开始使用 AutoGPT。",
            )}
          </Text>
          {returnUrl && forUser ? (
            <Text variant="small" tone="muted" className="mt-3 block">
              {t(
                "Try it now — “research a topic”, “build me a workflow”, or “draft a doc”.",
                "立即试试：“研究一个主题”、“帮我创建工作流”或“起草文档”。",
              )}
            </Text>
          ) : null}
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
          {returnUrl ? (
            <Button
              as="NextLink"
              href={returnUrl}
              size="small"
              leftIcon={<Icon icon={ArrowTurnBackwardIcon} size={16} />}
            >
              {t(`Return to ${platform}`, `返回 ${platform}`)}
            </Button>
          ) : null}
          <Button
            as="NextLink"
            href="/settings/bots"
            variant="outline"
            size="small"
          >
            {t("Manage bots", "管理机器人")}
          </Button>
        </div>

        {returnUrl ? null : (
          <Text variant="small" tone="muted" className="text-center">
            {t(
              "You can close this page and go back to your chat.",
              "你可以关闭此页面并返回聊天。",
            )}
          </Text>
        )}
      </div>
    </AuthCard>
  );
}
