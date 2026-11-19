"use client";

import type { AccountIPReport } from "@/app/api/__generated__/models/accountIPReport";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { UserBlock01Icon } from "@hugeicons/core-free-icons";
import { type AdminUser, pluralize } from "../../../helpers";
import { AccountChecklist } from "../AccountChecklist";
import { ReasonFields } from "../ReasonFields";
import { AlsoBlockList } from "./AlsoBlockList";
import { useBanAllDialog } from "./useBanAllDialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  user: AdminUser;
  report: AccountIPReport;
  signedInUserId: string | undefined;
  ownIP: string | null;
}

export function BanAllDialog({ user, report, signedInUserId, ownIP }: Props) {
  const { t } = useTranslation();
  const dialog = useBanAllDialog({ user, report, signedInUserId });
  const accountWord = dialog.banCount === 1 ? "account" : "accounts";
  const confirmLabel = dialog.isRetry
    ? t(`Retry ${dialog.banCount} failed`, `重试 ${dialog.banCount} 个失败项`)
    : dialog.isBlockOnly
      ? t(`Block ${dialog.blockSummary}`, `阻止 ${dialog.blockSummary}`)
      : [
          t(
            `Ban ${dialog.banCount} ${accountWord}`,
            `封禁 ${dialog.banCount} 个账户`,
          ),
          dialog.blockCount > 0
            ? t(`block ${dialog.blockCount}`, `阻止 ${dialog.blockCount} 项`)
            : null,
        ]
          .filter(Boolean)
          .join(", ");

  return (
    <Dialog
      title={
        dialog.isBlockOnly
          ? t(`Block ${dialog.blockSummary}?`, `阻止 ${dialog.blockSummary}？`)
          : t(
              `Ban ${pluralize(dialog.banCount, "account")}?`,
              `封禁 ${dialog.banCount} 个账户？`,
            )
      }
      styling={{ maxWidth: "520px" }}
      controlled={{ isOpen: dialog.isOpen, set: dialog.handleOpenChange }}
    >
      <Dialog.Trigger>
        <Button variant="secondary" size="small" leadingIcon={UserBlock01Icon}>
          {t("Ban all…", "全部封禁…")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          {dialog.isBlockOnly ? null : (
            <Text variant="body" tone="secondary">
              {t(
                "They're signed out and can't sign in again until the ban ends, but for up to 5 minutes they can still get a token that works for an hour. Their API keys, schedules and triggers keep running.",
                "这些账户会退出登录，封禁结束前无法再次登录。但在接下来的 5 分钟内，仍可能获得可使用 1 小时的令牌。其 API 密钥、计划任务和触发器仍会继续运行。",
              )}
            </Text>
          )}
          {dialog.tickedAdmins > 0 ? (
            <Alert variant="warning">
              <AlertDescription>
                {dialog.tickedAdmins === 1
                  ? t(
                      "1 of these accounts is an admin.",
                      "其中 1 个账户是管理员。",
                    )
                  : t(
                      `${dialog.tickedAdmins} of these accounts are admins.`,
                      `其中 ${dialog.tickedAdmins} 个账户是管理员。`,
                    )}
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-1">
            <AccountChecklist
              accounts={dialog.accounts}
              ticked={dialog.ticked}
              onToggle={dialog.toggleAccount}
              results={dialog.results}
              maxHeightClassName="max-h-[240px]"
            />
            {dialog.excludesSelf ? (
              <Text variant="small" tone="muted">
                {t("Your own account isn't included.", "不包含你自己的账户。")}
              </Text>
            ) : null}
          </div>
          <AlsoBlockList
            options={dialog.blockOptions}
            ticked={dialog.blocksTicked}
            done={dialog.blocksDone}
            onToggle={dialog.toggleBlock}
            alreadyBlockedDomain={
              report.domain.block ? report.domain.value : null
            }
            ownIP={ownIP}
          />
          <ReasonFields
            idPrefix="ban-all"
            reason={dialog.reason}
            onReasonChange={dialog.setReason}
            duration={dialog.duration}
            onDurationChange={dialog.setDuration}
          />
        </div>
        <Dialog.Footer>
          <Button
            variant="secondary"
            size="small"
            disabled={dialog.isSubmitting}
            onClick={() => dialog.handleOpenChange(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant={dialog.isBlockOnly ? "primary" : "destructive"}
            size="small"
            loading={dialog.isSubmitting}
            disabled={
              !dialog.reason.trim() || dialog.banCount + dialog.blockCount === 0
            }
            onClick={() => void dialog.submit()}
          >
            {confirmLabel}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
