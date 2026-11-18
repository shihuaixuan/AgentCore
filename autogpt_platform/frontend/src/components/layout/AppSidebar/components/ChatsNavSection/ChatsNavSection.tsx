"use client";

import { Icon } from "@/components/atoms/Icon/Icon";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/molecules/Sidebar/Sidebar";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { tourTarget } from "@/lib/tour-targets";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { Suspense } from "react";
import { useJumpToRecentChats } from "../../useJumpToRecentChats";
import { useNavItemClassName } from "../../useNavItemClassName";
import { ChatsRailItem } from "../ChatsRailItem/ChatsRailItem";
import { CollapsibleNavGroup } from "../CollapsibleNavGroup/CollapsibleNavGroup";
import { RecentChats } from "../RecentChats/RecentChats";

interface Props {
  itemVariants: Variants;
}

export function ChatsNavSection({ itemVariants }: Props) {
  const { t } = useTranslation();
  const newChatLabel = t("New chat", "新建对话");
  const navItemClassName = useNavItemClassName();
  const {
    isRecentChatsOpen,
    setIsRecentChatsOpen,
    recentChatsRef,
    jumpToRecentChats,
  } = useJumpToRecentChats();

  return (
    <motion.div variants={itemVariants} {...tourTarget("chats")}>
      <SidebarGroup className="py-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={newChatLabel}
              className={navItemClassName}
            >
              <Link href="/home" aria-label={newChatLabel}>
                <Icon icon={Add01Icon} tone="emphasis-soft" aria-hidden />
                <span className="truncate">{newChatLabel}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <div className="hidden group-data-[collapsible=icon]:block">
        <ChatsRailItem onClick={jumpToRecentChats} />
      </div>

      <div
        ref={recentChatsRef}
        className="group-data-[collapsible=icon]:hidden"
      >
        <CollapsibleNavGroup
          label={t("Recent chats", "最近对话")}
          open={isRecentChatsOpen}
          onOpenChange={setIsRecentChatsOpen}
        >
          {/* Suspense boundary: RecentChats reads useSearchParams(), which
            Next.js requires to be wrapped to avoid forcing the route to
            client-side rendering. */}
          <Suspense fallback={null}>
            <RecentChats />
          </Suspense>
        </CollapsibleNavGroup>
      </div>
    </motion.div>
  );
}
