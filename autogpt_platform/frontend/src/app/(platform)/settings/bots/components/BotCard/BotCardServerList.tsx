"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import type { PlatformLinkInfo } from "@/app/api/__generated__/models/platformLinkInfo";
import {
  AlertCircleIcon,
  Delete02Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  platformName: string;
  serverNoun: string;
  addBotLabel: string;
  serverLinks: PlatformLinkInfo[];
  isPending: (linkId: string) => boolean;
  onUnlink: (linkId: string) => void;
};

export function BotCardServerList({
  platformName,
  serverNoun,
  addBotLabel,
  serverLinks,
  isPending,
  onUnlink,
}: Props) {
  const { t } = useTranslation();
  if (serverLinks.length === 0) {
    return (
      <div className="rounded-large border border-dashed border-border-base px-4 py-3">
        <Text variant="small" as="span" tone="muted">
          {t(
            `No ${serverNoun}s linked yet. Use "${addBotLabel}" to invite the bot — already added it? Run /setup there to finish connecting.`,
            `尚未连接任何${serverNoun === "workspace" ? "工作区" : serverNoun === "group" ? "群组" : "服务器"}。点击“${addBotLabel}”邀请机器人。如果已添加机器人，请在那里运行 /setup 以完成连接。`,
          )}
        </Text>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {serverLinks.map((link) => (
        <BotCardServerRow
          key={link.id}
          link={link}
          platformName={platformName}
          serverNoun={serverNoun}
          isPending={isPending(link.id)}
          onUnlink={() => onUnlink(link.id)}
        />
      ))}
    </ul>
  );
}

type RowProps = {
  link: PlatformLinkInfo;
  platformName: string;
  serverNoun: string;
  isPending: boolean;
  onUnlink: () => void;
};

function BotCardServerRow({
  link,
  platformName,
  serverNoun,
  isPending,
  onUnlink,
}: RowProps) {
  const { t } = useTranslation();
  const botMissing = !link.server_name;
  const displayLabel = link.server_name ?? link.platform_server_id;

  return (
    <li className="flex items-center justify-between gap-3 rounded-large border border-border-base px-4 py-3">
      <div className="flex min-w-0 items-center gap-3 text-foreground-tertiary">
        <Icon icon={UserMultipleIcon} size={20} className="shrink-0" />
        <div className="flex min-w-0 flex-col">
          <Text variant="body-medium" as="span" className="truncate">
            {displayLabel}
          </Text>
          {botMissing ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-caption text-warning-foreground">
                  <Icon icon={AlertCircleIcon} size={14} />{" "}
                  {t("Name unavailable", "名称不可用")}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t(
                  `${platformName} didn't give us a name for this ${serverNoun}. It stays linked and usable; unlink to remove this row.`,
                  `${platformName} 未提供此连接的名称。该连接仍可正常使用；解除绑定即可移除此记录。`,
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Text variant="small" as="span" tone="muted">
              {t("Linked by you", "由你连接")}
            </Text>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="small"
        leftIcon={<Icon icon={Delete02Icon} size={16} />}
        loading={isPending}
        onClick={onUnlink}
        aria-label={t(`Unlink ${displayLabel}`, `解除 ${displayLabel} 的绑定`)}
      >
        {t("Unlink", "断开连接")}
      </Button>
    </li>
  );
}
