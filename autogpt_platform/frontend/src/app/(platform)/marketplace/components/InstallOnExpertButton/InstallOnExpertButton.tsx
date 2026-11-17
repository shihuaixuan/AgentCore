"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { InstallWorkflowPicker } from "@/components/molecules/InstallWorkflowPicker/InstallWorkflowPicker";
import { useInstallOnExpertButton } from "./useInstallOnExpertButton";

interface Props {
  storeListingVersionId: string;
}

export function InstallOnExpertButton({ storeListingVersionId }: Props) {
  const { t } = useTranslation();
  const { canInstall, pickerOpen, openPicker, closePicker } =
    useInstallOnExpertButton();

  if (!canInstall) return null;

  return (
    <>
      <Button variant="secondary" onClick={openPicker}>
        {t("Install on Expert…", "安装到专家…")}
      </Button>
      <InstallWorkflowPicker
        mode="pick-expert"
        storeListingVersionId={storeListingVersionId}
        open={pickerOpen}
        onClose={closePicker}
      />
    </>
  );
}
