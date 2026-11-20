"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { AuthCard } from "@/components/auth/AuthCard";
import { LinkType } from "@/app/api/__generated__/models/linkType";
import { isUserLink } from "../helpers";

interface Props {
  linkType: LinkType;
  platform: string;
  serverName: string | null;
  serverNoun: string;
  userEmail: string | null;
  isLinking: boolean;
  onLink: () => void;
  onSwitchAccount: () => void;
}

export function ReadyView({
  linkType,
  platform,
  serverName,
  serverNoun,
  userEmail,
  isLinking,
  onLink,
  onSwitchAccount,
}: Props) {
  const { t } = useTranslation();
  const forUser = isUserLink(linkType);
  const title = buildTitle({ forUser, platform, serverName, serverNoun });
  const contextLabel = forUser
    ? `your ${platform} DMs`
    : (serverName ?? `this ${platform} ${serverNoun}`);

  return (
    <AuthCard
      title={t(
        title,
        forUser
          ? `关联你的 ${platform} 私信`
          : `为 ${serverName ?? platform} 设置 AutoGPT`,
      )}
      // oxlint-disable-next-line design-system/no-restyle -- AuthCard has no roomy size; keeps today's p-8 padding and gap-6
      className="max-w-[38rem] gap-6 p-8"
    >
      <div className="flex w-full flex-col items-center gap-6">
        <div className="w-full rounded-xl bg-surface-hover px-6 py-5 text-left">
          <Text variant="body-medium">
            {t("What happens when you confirm:", "确认后会发生什么：")}
          </Text>
          {forUser ? (
            <ul className="mt-4 space-y-2.5 text-body leading-relaxed text-foreground-tertiary">
              <li>
                {t(
                  `${contextLabel} will be linked to your AutoGPT account`,
                  `${forUser ? platform + " 私信" : contextLabel}将关联到你的 AutoGPT 账户`,
                )}
              </li>
              <li>
                {t(
                  "DMs with the bot run as your own private AutoGPT chat",
                  "与机器人的私信将作为你自己的私人 AutoGPT 聊天运行",
                )}
              </li>
              <li>
                {t(
                  "All usage from those DMs is billed to your account",
                  "这些私信的所有用量将计入你的账户账单",
                )}
              </li>
            </ul>
          ) : (
            <ul className="mt-4 space-y-2.5 text-body leading-relaxed text-foreground-tertiary">
              <li>
                {t(
                  `${contextLabel} will be connected to your AutoGPT account`,
                  `${contextLabel}将连接到你的 AutoGPT 账户`,
                )}
              </li>
              <li>
                {t(
                  `Anyone in the ${serverNoun} can give AutoGPT tasks`,
                  `共享空间中的所有人都可以向 ${AUTOPILOT_NAME} 分配任务`,
                )}
              </li>
              <li>
                {t(
                  `Conversations in a shared ${serverNoun} are visible to everyone there — for private 1:1 work, DM the bot and link your own AutoGPT account`,
                  "共享空间中的对话对所有成员可见。如需私人一对一处理工作，请私信机器人并关联你自己的 AutoGPT 账户",
                )}
              </li>
              <li>
                {t(
                  "Uses the tools and integrations connected to your AutoGPT account",
                  "使用已连接到你的 AutoGPT 账户的工具和集成",
                )}
              </li>
            </ul>
          )}
        </div>

        <div className="w-full rounded-xl border border-border-base bg-surface-hover px-5 py-4">
          <Text variant="small-relaxed" tone="muted">
            {t(
              `Usage from ${contextLabel} is billed to your AutoGPT account. You can unlink at any time in Settings → Bots.`,
              `来自${forUser ? platform + " 私信" : contextLabel}的用量将计入你的 AutoGPT 账户账单。你可以随时在设置 → 机器人中取消关联。`,
            )}
          </Text>
        </div>

        <Button
          onClick={onLink}
          loading={isLinking}
          disabled={isLinking}
          className="w-full sm:w-auto sm:min-w-[16rem]"
        >
          {forUser
            ? t(`Connect my ${platform} DMs`, `连接我的 ${platform} 私信`)
            : t(
                `Connect ${platform} to AutoGPT`,
                `将 ${platform} 连接到 AutoGPT`,
              )}
        </Button>

        {userEmail && (
          <div className="flex w-full items-center justify-between">
            <Text variant="small" tone="muted">
              {t(`Signed in as ${userEmail}`, `当前登录账户：${userEmail}`)}
            </Text>
            <Button variant="ghost" size="small" onClick={onSwitchAccount}>
              <Text
                variant="small-medium-loose-underline"
                as="span"
                tone="muted"
              >
                {t("Not you? Sign out", "不是你？退出登录")}
              </Text>
            </Button>
          </div>
        )}
      </div>
    </AuthCard>
  );
}

function buildTitle(args: {
  forUser: boolean;
  platform: string;
  serverName: string | null;
  serverNoun: string;
}): string {
  if (args.forUser) return `Link your ${args.platform} DMs`;
  if (args.serverName) return `Set up AutoGPT for ${args.serverName}`;
  return `Set up AutoGPT for this ${args.platform} ${args.serverNoun}`;
}
