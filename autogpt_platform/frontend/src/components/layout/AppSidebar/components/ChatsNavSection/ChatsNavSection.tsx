"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { tourTarget } from "@/lib/tour-targets";
import { motion, type Variants } from "framer-motion";
import { Suspense } from "react";
import { useJumpToRecentChats } from "../../useJumpToRecentChats";
import { ChatsRailItem } from "../ChatsRailItem/ChatsRailItem";
import { CollapsibleNavGroup } from "../CollapsibleNavGroup/CollapsibleNavGroup";
import { RecentChats } from "../RecentChats/RecentChats";

interface Props {
  itemVariants: Variants;
}

export function ChatsNavSection({ itemVariants }: Props) {
  const { t } = useTranslation();
  const {
    isRecentChatsOpen,
    setIsRecentChatsOpen,
    recentChatsRef,
    jumpToRecentChats,
  } = useJumpToRecentChats();

  // One stagger slot: only one of the two is ever displayed.
  return (
    <motion.div variants={itemVariants} {...tourTarget("chats")}>
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
