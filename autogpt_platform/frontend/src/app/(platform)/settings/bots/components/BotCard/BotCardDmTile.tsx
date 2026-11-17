"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import type { PlatformUserLinkInfo } from "@/app/api/__generated__/models/platformUserLinkInfo";
import {
  Chatting01Icon,
  Delete02Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  platformName: string;
  serverNoun: string;
  dmLink: PlatformUserLinkInfo | null;
  pendingServerName?: string | null;
  isPending: (linkId: string) => boolean;
  onUnlink: (linkId: string) => void;
};

export function BotCardDmTile({
  platformName,
  serverNoun,
  dmLink,
  pendingServerName,
  isPending,
  onUnlink,
}: Props) {
  const { t } = useTranslation();
  const title = dmLink
    ? (dmLink.platform_username ??
      t(`User ${dmLink.platform_user_id}`, `用户 ${dmLink.platform_user_id}`))
    : pendingServerName
      ? t(
          `${capitalize(serverNoun)} “${pendingServerName}” connected — one step left`,
          `“${pendingServerName}”已连接，还差一步`,
        )
      : t(
          `DM the bot on ${platformName} to link`,
          `在 ${platformName} 上私信机器人以绑定`,
        );
  const subtitle = dmLink
    ? t(
        "Your DM channel is linked to this account.",
        "你的私信频道已绑定此账户。",
      )
    : pendingServerName
      ? t(
          `DM the bot in ${platformName} and tap Link Account to connect your DMs.`,
          `在 ${platformName} 中私信机器人，然后点击“Link Account”（绑定账户）以连接私信。`,
        )
      : t(
          "Send the bot a direct message to start the link flow.",
          "向机器人发送私信以开始绑定。",
        );

  return (
    <div className="flex items-center justify-between gap-3 rounded-large border border-border-base px-4 py-3">
      <div className="flex min-w-0 items-center gap-3 text-foreground-tertiary">
        <Icon icon={Chatting01Icon} size={20} className="shrink-0" />
        <div className="flex min-w-0 flex-col">
          <Text variant="body-medium" as="span">
            {title}
          </Text>
          <Text variant="small" as="span" tone="muted">
            {subtitle}
          </Text>
        </div>
      </div>
      {dmLink ? (
        <Button
          variant="outline"
          size="small"
          leftIcon={<Icon icon={Delete02Icon} size={16} />}
          loading={isPending(dmLink.id)}
          onClick={() => onUnlink(dmLink.id)}
          aria-label={t(
            `Unlink DM on ${platformName}`,
            `解除 ${platformName} 私信绑定`,
          )}
        >
          {t("Unlink", "断开连接")}
        </Button>
      ) : (
        <span className="inline-flex items-center gap-1 text-caption text-foreground-tertiary">
          <Icon icon={Link01Icon} size={14} /> {t("Not linked", "未连接")}
        </span>
      )}
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
