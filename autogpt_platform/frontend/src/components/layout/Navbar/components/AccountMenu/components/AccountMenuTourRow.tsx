"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useShowMeAround } from "@/app/(platform)/components/FirstRunTour/useShowMeAround";
import { Icon } from "@/components/atoms/Icon/Icon";
import { PopoverClose } from "@/components/molecules/Popover/Popover";
import { Compass01Icon } from "@hugeicons/core-free-icons";
import { AccountMenuRow } from "./AccountMenuRow";

// Replays the first-run walkthrough. Closes the menu first so the walkthrough
// is not opening underneath it.
export function AccountMenuTourRow() {
  const { t } = useTranslation();
  const showMeAround = useShowMeAround();

  return (
    <PopoverClose asChild>
      <AccountMenuRow
        as="button"
        onClick={showMeAround}
        icon={
          <Icon icon={Compass01Icon} className="h-[18px] w-[18px] shrink-0" />
        }
        label={t("Show me around", "功能导览")}
      />
    </PopoverClose>
  );
}
