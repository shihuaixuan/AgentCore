"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Icon } from "@/components/atoms/Icon/Icon";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/molecules/Sidebar/Sidebar";
import { BubbleChatIcon } from "@hugeicons/core-free-icons";
import { useNavItemClassName } from "../../useNavItemClassName";

interface Props {
  onClick: () => void;
}

export function ChatsRailItem({ onClick }: Props) {
  const { t } = useTranslation();
  const navItemClassName = useNavItemClassName();

  return (
    <SidebarGroup className="py-1">
      <SidebarMenu className="group-data-[collapsible=icon]:gap-1">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={t("Chats", "对话")}
            onClick={onClick}
            className={navItemClassName}
          >
            <Icon
              icon={BubbleChatIcon}
              tone="emphasis-soft"
              className="size-4 group-data-[collapsible=icon]:size-4.5"
            />
            <span className="truncate">{t("Chats", "对话")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
