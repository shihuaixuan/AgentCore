"use client";

import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { IconWrapper } from "./IconWrapper";
import { SidebarItemCard } from "./SidebarItemCard";
import { TriggerAgentActionsDropdown } from "./TriggerAgentActionsDropdown";
import { Robot01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  triggerAgent: LibraryAgent;
  parentAgent: LibraryAgent;
  selected?: boolean;
  onClick?: () => void;
  onDeleted?: () => void;
}

export function TriggerAgentListItem({
  triggerAgent,
  parentAgent,
  selected,
  onClick,
  onDeleted,
}: Props) {
  const { t, locale } = useTranslation();
  return (
    <SidebarItemCard
      icon={
        <IconWrapper className="border-info-surface bg-info-surface text-foreground-body">
          <Icon icon={Robot01Icon} size={16} />
        </IconWrapper>
      }
      title={triggerAgent.name}
      description={`${t("Updated", "更新于")} ${formatDistanceToNow(
        triggerAgent.updated_at,
        {
          addSuffix: true,
          locale: locale === "zh-CN" ? zhCN : undefined,
        },
      )}`}
      onClick={onClick}
      selected={selected}
      actions={
        <TriggerAgentActionsDropdown
          parentAgent={parentAgent}
          triggerAgent={triggerAgent}
          onDeleted={onDeleted}
        />
      }
    />
  );
}
