"use client";

import { AutoGPTLogo } from "@/components/atoms/AutoGPTLogo/AutoGPTLogo";
import {
  SidebarHeader,
  useSidebar,
} from "@/components/molecules/Sidebar/Sidebar";
import { BRAND_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function TourSidebarHeader() {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const toggleButton = (
    <button
      type="button"
      aria-label={
        isCollapsed
          ? t("Expand sidebar", "展开侧边栏")
          : t("Collapse sidebar", "收起侧边栏")
      }
      onClick={toggleSidebar}
      className={cn(
        "size-8 shrink-0 items-center justify-center rounded-md text-foreground-emphasis transition-colors hover:bg-surface-active",
        isCollapsed
          ? "absolute inset-0 hidden group-focus-within:flex group-hover:flex"
          : "flex",
      )}
    >
      <Icon icon={SidebarLeftIcon} className="size-5" />
    </button>
  );

  return (
    // oxlint-disable-next-line design-system/no-restyle -- one-off mount fade; SidebarHeader has no motion variant
    <SidebarHeader className="flex animate-fade-in flex-row items-center justify-between group-data-[collapsible=icon]:flex-col">
      <div
        className={cn(
          "relative flex items-center",
          isCollapsed && "size-8 shrink-0",
        )}
      >
        <Link
          href="/marketplace"
          aria-label={t(BRAND_NAME.en, BRAND_NAME.zh)}
          className={cn(
            "flex items-center",
            isCollapsed &&
              "size-8 items-center justify-center group-focus-within:hidden group-hover:hidden",
          )}
        >
          <AutoGPTLogo alt="" className={isCollapsed ? "size-8" : "size-9"} />
        </Link>
        {isCollapsed ? toggleButton : null}
      </div>

      {isCollapsed ? null : toggleButton}
    </SidebarHeader>
  );
}
