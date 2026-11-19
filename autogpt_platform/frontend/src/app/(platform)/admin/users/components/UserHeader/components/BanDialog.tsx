"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { UserBlock01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
  type AdminUser,
  BAN_DURATIONS,
  type BanDuration,
  formatDateTime,
  formatTimeUntil,
  getBanEnd,
  getDisplayName,
} from "../../../helpers";
import { useIPReport } from "../../../useIPReport";
import { useUserBan } from "../../../useUserBan";

interface Props {
  user: AdminUser;
}

export function BanDialog({ user }: Props) {
  const { t, locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<BanDuration>("permanent");
  const { banUser, isBanning } = useUserBan(user);
  const { report } = useIPReport(user.id);
  const related = report?.related_total ?? 0;
  const banEnd = getBanEnd(duration);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open) {
      setReason("");
      setDuration("permanent");
    }
  }

  return (
    <Dialog
      title={`${t("Ban", "封禁")} ${getDisplayName(user)}?`}
      styling={{ maxWidth: "480px" }}
      controlled={{ isOpen, set: handleOpenChange }}
    >
      <Dialog.Trigger>
        <Button variant="secondary" size="small" leadingIcon={UserBlock01Icon}>
          {t("Ban user…", "封禁用户…")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <Text variant="body" tone="secondary">
            {t(
              "They're signed out and can't sign in again until the ban ends, but for up to 5 minutes they can still get a token that works for an hour. Their API keys, schedules and triggers keep running.",
              "用户会退出登录，封禁结束前无法再次登录。但在接下来的 5 分钟内，仍可能获得可使用 1 小时的令牌。其 API 密钥、计划任务和触发器仍会继续运行。",
            )}
          </Text>
          {related > 0 ? (
            <Text variant="small" tone="muted">
              {t("Only this account. To include the", "仅封禁此账户。如需包含")}{" "}
              {related === 1
                ? t("1 related account", "1 个关联账户")
                : `${related.toLocaleString("en-GB")} ${t("related accounts", "个关联账户")}`}
              ，
              {t(
                "use Ban all in Related accounts.",
                "请在“关联账户”中使用“全部封禁”。",
              )}
            </Text>
          ) : null}
          {user.role === "admin" ? (
            <Alert variant="warning">
              <AlertDescription>
                {t("This account is an admin.", "此账户具有管理员权限。")}
              </AlertDescription>
            </Alert>
          ) : null}
          <Input
            id="ban-reason"
            label={t("Reason (required)", "原因（必填）")}
            type="textarea"
            rows={3}
            placeholder={t("What they did", "违规行为说明")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            wrapperClassName="mb-0"
          />
          <div className="flex flex-col gap-1">
            <Select
              id="ban-duration"
              label={t("Duration", "时长")}
              value={duration}
              onValueChange={(value) => setDuration(value as BanDuration)}
              options={BAN_DURATIONS.map(({ value, label }) => ({
                value,
                label: t(
                  label,
                  {
                    permanent: "永久",
                    "1h": "1 小时",
                    "1d": "1 天",
                    "7d": "7 天",
                    "30d": "30 天",
                  }[value],
                ),
              }))}
              wrapperClassName="mb-0"
            />
            <Text variant="small" tone="muted">
              {banEnd
                ? t("Ends", "结束时间") +
                  ` ${formatDateTime(banEnd, locale)}（${formatTimeUntil(banEnd, undefined, locale)}）`
                : t("Doesn't end on its own.", "不会自动结束。")}
            </Text>
          </div>
        </div>
        <Dialog.Footer>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsOpen(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant="destructive"
            size="small"
            loading={isBanning}
            disabled={!reason.trim()}
            onClick={() =>
              banUser(
                { reason, duration },
                { onSuccess: () => setIsOpen(false) },
              )
            }
          >
            {t("Ban user", "封禁用户")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
