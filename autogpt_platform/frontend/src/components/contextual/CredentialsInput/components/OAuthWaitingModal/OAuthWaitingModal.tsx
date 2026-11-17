"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  providerName: string;
  /**
   * Set when the browser blocked the OAuth popup window and the helper
   * fell back to opening the login URL in a new tab. Changes the copy
   * to direct the user there instead of to a popup that doesn't exist.
   */
  popupBlocked?: boolean;
};

export function OAuthFlowWaitingModal({
  open,
  onClose,
  providerName,
  popupBlocked = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog
      title={t(
        `Waiting on ${providerName} sign-in process...`,
        `正在等待 ${providerName} 登录…`,
      )}
      controlled={{
        isOpen: open,
        set: (isOpen) => {
          if (!isOpen) onClose();
        },
      }}
      onClose={onClose}
    >
      <Dialog.Content>
        {popupBlocked ? (
          <Text variant="body-tight" tone="secondary">
            {t(
              "Your browser blocked the sign-in window, so we opened it in a new tab. Switch to that tab and complete sign-in there.",
              "浏览器阻止了登录窗口，因此我们已在新标签页中打开。请切换到该标签页完成登录。",
            )}
            <br />
            {t(
              "If you don't see the tab, allow popups for this site, close this dialog, and try connecting again.",
              "如果没有看到该标签页，请允许此网站弹出窗口，关闭此对话框后重新连接。",
            )}
          </Text>
        ) : (
          <Text variant="body-tight" tone="secondary">
            {t(
              "Complete the sign-in process in the sign-in window.",
              "请在登录窗口中完成登录。",
            )}
            <br />
            {t(
              "Closing this dialog will cancel the sign-in process.",
              "关闭此对话框将取消登录。",
            )}
          </Text>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
