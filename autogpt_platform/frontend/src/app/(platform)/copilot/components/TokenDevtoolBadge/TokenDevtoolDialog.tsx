"use client";

import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { TokenDevtoolPanel } from "./components/TokenDevtoolPanel";
import { useTokenDevtoolBadge } from "./useTokenDevtoolBadge";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The token devtool readout as a dialog, opened from the composer's +. */
export function TokenDevtoolDialog({ sessionId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const devtool = useTokenDevtoolBadge(sessionId);

  return (
    <Dialog
      title={t("Token usage", "Token 用量")}
      controlled={{ isOpen: open, set: onOpenChange }}
      styling={{ maxWidth: "24rem" }}
    >
      <Dialog.Content>
        <TokenDevtoolPanel {...devtool} />
      </Dialog.Content>
    </Dialog>
  );
}
