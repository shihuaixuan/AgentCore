"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import Link from "next/link";
import { Alert02Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/atoms/Icon/Icon";
import { AttentionCard } from "@/components/organisms/AttentionCard/AttentionCard";
import { cn } from "@/lib/utils";

interface Props {
  visible: boolean;
  /** Who the message goes to: Otto, or the expert the chat is with. */
  assistantName: string;
  className?: string;
}

/** Shown while the draft holds something shaped like a key. It only warns:
 *  sending stays possible and the text is never changed. The status region
 *  stays mounted, hidden and empty, so screen readers announce the warning
 *  when it appears inside it; a region mounted with its text is often not
 *  announced. */
export function SecretPasteNotice({
  visible,
  assistantName,
  className,
}: Props) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      data-testid="secret-paste-notice"
      className={visible ? cn("w-full", className) : "sr-only"}
    >
      {visible && (
        <AttentionCard.Root variant="warning" density="compact">
          <AttentionCard.Row>
            <AttentionCard.Icon>
              <Icon icon={Alert02Icon} className="h-4 w-4" aria-hidden />
            </AttentionCard.Icon>
            <AttentionCard.Content asChild>
              <span>
                {t(
                  `This looks like an API key or other secret. Anything you send here is saved in the chat. To let ${assistantName} use a key, add it under `,
                  `这看起来像 API 密钥或其他机密。你在此发送的所有内容都会保存在对话中。若要让 ${assistantName} 使用密钥，请将其添加到`,
                )}
                <Link
                  href="/marketplace/connectors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2"
                >
                  {t("Marketplace → Connectors", "市场 → 连接器")}
                </Link>
                {t(" instead.", "。")}
              </span>
            </AttentionCard.Content>
          </AttentionCard.Row>
        </AttentionCard.Root>
      )}
    </div>
  );
}
