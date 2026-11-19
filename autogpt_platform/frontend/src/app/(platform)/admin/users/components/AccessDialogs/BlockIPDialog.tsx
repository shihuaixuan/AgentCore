"use client";

import type { AccountIP } from "@/app/api/__generated__/models/accountIP";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  type BanDuration,
  formatDate,
  getBanEnd,
  pluralize,
} from "../../helpers";
import { ReasonFields } from "./ReasonFields";
import { useBlockSubmit } from "./useBlockSubmit";

// An address this many accounts share is more likely an office, a school or
// a VPN exit than one person.
const SHARED_ADDRESS_WARNING_AT = 5;

interface Props {
  ip: AccountIP;
  ownIP: string | null;
  // Hidden, not unmounted, once the address is blocked, so a 409 stays readable.
  showTrigger: boolean;
}

export function BlockIPDialog({ ip, ownIP, showTrigger }: Props) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<BanDuration>("permanent");
  const { submitBlock, isCreating, conflict, clearConflict, viewBlocksAction } =
    useBlockSubmit();
  const users = ip.other_account_count + 1;
  const address = ip.display_address;

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) return;
    setReason("");
    setDuration("permanent");
    clearConflict();
  }

  async function submit() {
    const expiresAt = getBanEnd(duration);
    const ok = await submitBlock({
      kind: "IP",
      value: ip.ip_address,
      reason,
      expiresAt,
      failureTitle: t("Couldn't block the address", "无法阻止该地址"),
    });
    if (!ok) return;
    setIsOpen(false);
    toast({
      title: t(`Blocked ${address}`, `已阻止 ${address}`),
      description: expiresAt
        ? t(
            `No sign-ups or sign-ins from it until ${formatDate(expiresAt, locale)}.`,
            `在 ${formatDate(expiresAt, locale)} 之前，该地址无法注册或登录。`,
          )
        : t("No sign-ups or sign-ins from it.", "该地址无法注册或登录。"),
      variant: "success",
      action: viewBlocksAction,
    });
  }

  return (
    <Dialog
      title={t(`Block ${address}?`, `阻止 ${address}？`)}
      styling={{ maxWidth: "480px" }}
      controlled={{ isOpen, set: handleOpenChange }}
    >
      {showTrigger ? (
        <Dialog.Trigger>
          <Button variant="ghost" size="small">
            {t("Block…", "阻止…")}
          </Button>
        </Dialog.Trigger>
      ) : null}
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <Text variant="body" tone="secondary">
            {t(
              "No one can sign up or sign in from this address until the block ends.",
              "阻止结束前，任何人都无法从该地址注册或登录。",
            )}{" "}
            {users === 1
              ? t(
                  "The 1 account that used it stays signed in but is refused next time.",
                  "使用过该地址的 1 个账户会保持登录，但下次登录将被拒绝。",
                )
              : t(
                  `The ${users} accounts that used it stay signed in but are refused next time.`,
                  `使用过该地址的 ${users} 个账户会保持登录，但下次登录将被拒绝。`,
                )}
          </Text>
          {users >= SHARED_ADDRESS_WARNING_AT ? (
            <Alert variant="warning">
              <AlertDescription>
                {t(
                  `${pluralize(users, "account")} have used this address. It may be an office, a school or a VPN exit.`,
                  `${users} 个账户使用过该地址。它可能属于办公室、学校或 VPN 出口。`,
                )}
              </AlertDescription>
            </Alert>
          ) : null}
          {ownIP && ownIP === ip.ip_address ? (
            <Alert variant="warning">
              <AlertDescription>
                {t(
                  "You're signed in from this address. You'd be refused at your next sign-in too.",
                  "你当前正从该地址登录。你的下次登录也会被拒绝。",
                )}
              </AlertDescription>
            </Alert>
          ) : null}
          {conflict ? (
            <Alert variant="warning">
              <AlertDescription>{conflict}</AlertDescription>
            </Alert>
          ) : null}
          <ReasonFields
            idPrefix="block-ip"
            reason={reason}
            onReasonChange={setReason}
            duration={duration}
            onDurationChange={setDuration}
          />
        </div>
        <Dialog.Footer>
          <Button
            variant="secondary"
            size="small"
            disabled={isCreating}
            onClick={() => setIsOpen(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant="primary"
            size="small"
            loading={isCreating}
            disabled={!reason.trim() || Boolean(conflict)}
            onClick={() => void submit()}
          >
            {t("Block address", "阻止地址")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
