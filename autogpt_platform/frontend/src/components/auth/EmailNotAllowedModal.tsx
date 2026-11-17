"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Dialog } from "../molecules/Dialog/Dialog";
import { WaitlistErrorContent } from "./WaitlistErrorContent";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailNotAllowedModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      title={t("Email Not Allowed", "此邮箱不允许注册")}
      controlled={{ isOpen, set: onClose }}
      styling={{ maxWidth: "35rem" }}
    >
      <Dialog.Content>
        <div className="py-4">
          <WaitlistErrorContent />
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
