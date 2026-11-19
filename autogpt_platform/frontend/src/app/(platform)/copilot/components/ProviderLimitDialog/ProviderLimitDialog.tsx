"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

import type { ProviderFailure } from "../../providerFailure";
import { useProviderLimitDialog } from "./useProviderLimitDialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  failure: ProviderFailure | null;
  sessionId: string | null;
  onDismiss: () => void;
}

/**
 * A linked subscription stopped accepting turns. Offer to keep going.
 *
 * The PRD's out-of-limit path: the run pauses and offers to continue
 * somewhere else, and never moves the bill on its own. A dialog rather than a
 * toast because the choice has a cost — the rest of this chat spends AutoGPT
 * credits instead of a plan the user already pays for — and that is not a
 * thing to slip past someone in the corner of the screen.
 *
 * Waiting stays a real option. When the provider told us when the limit
 * resets that is said here; an invented time would be worse than none,
 * because people plan around it.
 */
export function ProviderLimitDialog({ failure, sessionId, onDismiss }: Props) {
  const { t } = useTranslation();
  const {
    alternative,
    continueHere,
    isSwitching,
    resetHint,
    isLoadingOffers,
    failedToLoadOffers,
    retryOffers,
  } = useProviderLimitDialog({ failure, sessionId, onDismiss });

  return (
    <Dialog
      title={t(
        "You've hit this connection's limit",
        "你已达到此连接的使用上限",
      )}
      styling={{ maxWidth: "30rem", minWidth: "auto" }}
      controlled={{
        isOpen: Boolean(failure),
        set: (open) => {
          if (!open) onDismiss();
        },
      }}
    >
      <Dialog.Content>
        <Text tone="secondary" variant="body">
          {failure?.message?.trim() ||
            t(
              "The connection this chat runs on stopped accepting turns.",
              "此对话使用的连接已停止接受新请求。",
            )}
          {resetHint ? ` ${resetHint}` : ""}
        </Text>

        {isLoadingOffers ? (
          <Text tone="muted" variant="small" className="mt-3">
            {t(
              "Checking what else this chat can run on…",
              "正在检查此对话可使用的其他连接…",
            )}
          </Text>
        ) : failedToLoadOffers ? (
          <>
            <Text tone="muted" variant="small" className="mt-3">
              {t(
                "We couldn't check your other connections just now.",
                "暂时无法检查你的其他连接。",
              )}
            </Text>
            <Dialog.Footer>
              <Button variant="secondary" onClick={onDismiss}>
                {t("Close", "关闭")}
              </Button>
              <Button variant="primary" onClick={retryOffers}>
                {t("Try again", "重试")}
              </Button>
            </Dialog.Footer>
          </>
        ) : alternative ? (
          <>
            <Text tone="muted" variant="small" className="mt-3">
              {t(
                `Continuing moves the rest of this chat to ${alternative.display_name}. Everything already said stays as it is, on the connection it ran on.`,
                `继续后，此对话的后续内容将使用 ${alternative.display_name}。已完成的内容及其使用的连接保持不变。`,
              )}
            </Text>
            <Dialog.Footer>
              <Button variant="secondary" onClick={onDismiss}>
                {t("Wait for it to reset", "等待额度重置")}
              </Button>
              <Button
                variant="primary"
                onClick={continueHere}
                loading={isSwitching}
              >
                {t(
                  `Continue on ${alternative.display_name}`,
                  `使用 ${alternative.display_name} 继续`,
                )}
              </Button>
            </Dialog.Footer>
          </>
        ) : (
          <>
            {/* Nothing to offer: saying so is better than a button that
                cannot do anything. */}
            <Text tone="muted" variant="small" className="mt-3">
              {t(
                "There is no other connection set up to continue on. You can add one in Settings, or wait for this one to reset.",
                "暂无其他可继续使用的连接。你可以在设置中添加连接，或等待此连接的额度重置。",
              )}
            </Text>
            <Dialog.Footer>
              <Button variant="primary" onClick={onDismiss}>
                {t("Close", "关闭")}
              </Button>
            </Dialog.Footer>
          </>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
