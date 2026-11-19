"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import Image from "next/image";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/atoms/Card/Card";
import { Text } from "@/components/atoms/Text/Text";
import type { BotPlatformInfo } from "@/app/api/__generated__/models/botPlatformInfo";

import { BotCardDmTile } from "./BotCardDmTile";
import { BotCardServerList } from "./BotCardServerList";
import { getAddBotLabel } from "./helpers";
import { useBotCard } from "./useBotCard";
import { ArrowUpRight01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

type Props = {
  platform: BotPlatformInfo;
};

export function BotCard({ platform }: Props) {
  const { t } = useTranslation();
  const { isPending, unlinkServerLink, unlinkDmLink } = useBotCard();
  const serverLinks = platform.server_links ?? [];
  const pendingInstall = platform.pending_install ?? null;
  // Optional in the generated client (it has a server-side default).
  const serverNoun = platform.server_noun ?? "server";
  const dmUrl = platform.dm_url ?? null;
  const serverLabel =
    serverNoun === "workspace"
      ? t("workspace", "工作区")
      : serverNoun === "group"
        ? t("group", "群组")
        : t("server", "服务器");
  const addBotLabel = t(
    getAddBotLabel(platform, serverNoun),
    platform.dm_url
      ? `添加至${serverLabel}`
      : `将机器人添加至 ${platform.display_name}`,
  );

  return (
    // oxlint-disable-next-line design-system/no-restyle -- bot cards are tighter than the Card default
    <Card className="flex flex-col gap-5 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image
            src={`/integrations/${platform.icon}`}
            alt={t(
              `${platform.display_name} icon`,
              `${platform.display_name} 图标`,
            )}
            width={32}
            height={32}
            className="rounded-md"
          />
          <Text variant="large-medium" as="h2">
            {platform.display_name}
          </Text>
          {pendingInstall ? (
            <Badge variant="info" size="small">
              {t(
                `Pending — finish in ${platform.display_name}`,
                `待完成 — 请在 ${platform.display_name} 中完成绑定`,
              )}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingInstall ? (
            <Button
              as="NextLink"
              href={pendingInstall.open_bot_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="small"
              rightIcon={<Icon icon={ArrowUpRight01Icon} size={16} />}
            >
              {t(
                `Open AutoGPT in ${platform.display_name}`,
                `在 ${platform.display_name} 中打开 AutoGPT`,
              )}
            </Button>
          ) : null}
          {dmUrl ? (
            <Button
              as="NextLink"
              href={dmUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="small"
              rightIcon={<Icon icon={ArrowUpRight01Icon} size={16} />}
            >
              {t(
                `Message bot on ${platform.display_name}`,
                `在 ${platform.display_name} 中联系机器人`,
              )}
            </Button>
          ) : null}
          {/* Kept alongside the pending action, not replaced by it: adding the
              bot to a second {serverNoun} is a normal thing to want while the
              first install is still waiting on its DM. */}
          {platform.add_bot_url ? (
            // Same tab on purpose: the install round-trip ends by returning here,
            // so a new tab would just strand the user on a dead page.
            <Button
              as="NextLink"
              href={platform.add_bot_url}
              variant={pendingInstall || dmUrl ? "outline" : "primary"}
              size="small"
              leftIcon={<Icon icon={PlusSignIcon} size={16} />}
            >
              {addBotLabel}
            </Button>
          ) : null}
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <Text
          variant="small-medium"
          as="span"
          tone="muted"
          transform="uppercase"
          tracking="wide"
        >
          {t("Direct messages", "私信")}
        </Text>
        <BotCardDmTile
          platformName={platform.display_name}
          serverNoun={serverNoun}
          dmLink={platform.dm_link ?? null}
          pendingServerName={pendingInstall?.server_name ?? null}
          isPending={isPending}
          onUnlink={unlinkDmLink}
        />
      </section>

      <section className="flex flex-col gap-2">
        <Text
          variant="small-medium"
          as="span"
          tone="muted"
          transform="uppercase"
          tracking="wide"
        >
          {t(`Linked ${serverNoun}s`, `已连接的${serverLabel}`)}
        </Text>
        <BotCardServerList
          platformName={platform.display_name}
          serverNoun={serverNoun}
          addBotLabel={addBotLabel}
          serverLinks={serverLinks}
          isPending={isPending}
          onUnlink={unlinkServerLink}
        />
      </section>
    </Card>
  );
}
