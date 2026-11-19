"use client";

import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  AppSidebarTrigger,
  useAppSidebarToggle,
} from "@/components/layout/AppSidebar/components/AppSidebarTrigger/AppSidebarTrigger";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { BubbleChatIcon } from "@hugeicons/core-free-icons";

export type FloatingControls = "newLayout";

// Below `lg` the sidebar button moves into the chip itself (see
// PlatformChrome) and the files and integrations buttons onto the composer
// (ComposerPanelTab), so the chip stands alone, centred near the top edge.
const floatingControlsClassName: Record<FloatingControls, string> = {
  newLayout: "max-lg:top-2 max-lg:justify-center",
};

const chipButtonClassName =
  "size-9 shrink-0 rounded-full hover:bg-surface-hover";

interface Props {
  title?: string | null;
  /** Which layout floats its controls over the chat's top-left corner on
   *  small viewports; the chip lines up with them. */
  floatingControls?: FloatingControls;
}

/** Floats as a translucent chip pinned to the pane's top-left gutter — the
 *  zero-height wrapper keeps it out of the flex flow so messages scroll
 *  underneath.
 *  In the new layout on phones the chip also carries the sidebar button. */
export function ThreadHeader({ title, floatingControls }: Props) {
  const { t } = useTranslation();
  const hasSidebar = Boolean(useAppSidebarToggle());
  const hasSidebarButton = floatingControls === "newLayout" && hasSidebar;

  return (
    <div data-testid="expert-thread-header" className="relative z-20 h-0">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-3 flex justify-start px-4",
          floatingControls && floatingControlsClassName[floatingControls],
        )}
      >
        <div
          className={cn(
            "pointer-events-auto flex min-h-11 min-w-0 items-center gap-2 rounded-full border border-border-base/70 bg-surface/75 px-3 py-1 shadow-sm backdrop-blur-md max-lg:shadow-md",
            hasSidebarButton && "max-md:pl-1",
          )}
        >
          {hasSidebarButton && (
            <AppSidebarTrigger
              className={cn(chipButtonClassName, "md:hidden")}
            />
          )}
          <Icon icon={BubbleChatIcon} size={18} tone="secondary" aria-hidden />
          <Text
            variant="small-tight"
            as="span"
            weight="semibold"
            className="max-w-64 truncate"
          >
            {title || t("Conversation", "对话")}
          </Text>
        </div>
      </div>
    </div>
  );
}
