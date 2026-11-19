"use client";

import type { AccountIP } from "@/app/api/__generated__/models/accountIP";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { RelativeTime } from "@/components/atoms/RelativeTime/RelativeTime";
import { Text } from "@/components/atoms/Text/Text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/Tooltip/BaseTooltip";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  SquareLock01Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  formatDateTime,
  pluralize,
  summariseUserAgent,
} from "../../../helpers";
import { BlockIPDialog } from "../../AccessDialogs/BlockIPDialog";
import { UnblockDialog } from "../../AccessDialogs/UnblockDialog";

interface Props {
  ip: AccountIP;
  ownIP: string | null;
}

export function IPRow({ ip, ownIP }: Props) {
  const { t, locale } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const hiddenEvents = ip.event_count - ip.events.length;

  return (
    <li className="flex min-w-0 flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <Button
          variant="icon"
          size="icon-xs"
          aria-label={`${t(isExpanded ? "Hide" : "Show", isExpanded ? "隐藏" : "显示")} ${t("sign-ins from", "来自此地址的登录记录")} ${ip.display_address}`}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Icon icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} size={14} />
        </Button>
        <Address ip={ip} />
        {ip.has_sign_up ? (
          <Badge variant="success" size="small">
            {t("Sign-up", "注册")}
          </Badge>
        ) : null}
        {ip.sign_in_count > 0 ? (
          <Badge variant="info" size="small">
            {t(
              pluralize(ip.sign_in_count, "sign-in"),
              `${ip.sign_in_count} 次登录`,
            )}
          </Badge>
        ) : null}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {ip.block ? (
            <>
              <Badge variant="warning" size="small">
                <span className="flex items-center gap-1">
                  <Icon icon={SquareLock01Icon} size={12} />
                  {t("Blocked", "已拦截")}
                </span>
              </Badge>
              <UnblockDialog block={ip.block} triggerVariant="link" />
            </>
          ) : null}
          <BlockIPDialog ip={ip} ownIP={ownIP} showTrigger={!ip.block} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 pl-9">
        <Tooltip>
          <TooltipTrigger asChild>
            <Text variant="small" as="span" tone="secondary">
              {summariseUserAgent(ip.last_user_agent)}
            </Text>
          </TooltipTrigger>
          <TooltipContent>
            {ip.last_user_agent ?? t("No user agent", "未知浏览器")}
          </TooltipContent>
        </Tooltip>
        <Text variant="small" as="span" tone="muted">
          {formatDateTime(ip.last_seen, locale)} (
          <RelativeTime date={ip.last_seen} />)
        </Text>
        <Text variant="small" as="span" tone="secondary">
          {ip.other_account_count > 0
            ? `${ip.other_account_count} ${t("other accounts", "个其他账户")}`
            : "—"}
        </Text>
      </div>
      {isExpanded ? (
        <ul className="flex flex-col gap-1 pt-1 pl-9">
          {ip.events.map((event, index) => (
            <li
              key={`${event.kind}-${event.created_at.toISOString()}-${index}`}
            >
              <Text variant="small" className="break-words" tone="muted">
                {formatDateTime(event.created_at, locale)} ·{" "}
                {event.kind === "SIGN_UP"
                  ? t("Sign-up", "注册")
                  : t("Sign-in", "登录")}{" "}
                · {event.user_agent ?? t("No user agent", "未知浏览器")}
              </Text>
            </li>
          ))}
          {hiddenEvents > 0 ? (
            <li>
              <Text variant="small" tone="muted">
                {t("and", "以及")} {hiddenEvents.toLocaleString("en-GB")}{" "}
                {t("more", "条记录")}
              </Text>
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

function Address({ ip }: { ip: AccountIP }) {
  const { t } = useTranslation();
  const address = (
    <Text variant="body-mono-tight" as="span" translate="no">
      {ip.display_address}
    </Text>
  );
  if (!ip.is_ipv6_prefix) return address;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{address}</TooltipTrigger>
      <TooltipContent>
        {t(
          "IPv6 is recorded and blocked by its /64 prefix.",
          "IPv6 地址按 /64 前缀记录和拦截。",
        )}
      </TooltipContent>
    </Tooltip>
  );
}
