"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { useId } from "react";
import type { DeletionSource } from "../../helpers";
import { StepFooter } from "../StepFooter/StepFooter";
import { ConsequenceList } from "./components/ConsequenceList";
import { useConfirmDeleteStep } from "./useConfirmDeleteStep";

interface Props {
  source: DeletionSource;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
}

export function ConfirmDeleteStep({ source, onClose, onBusyChange }: Props) {
  const { t } = useTranslation();
  const labelID = useId();
  const inputID = useId();
  const {
    email,
    username,
    typedEmail,
    setTypedEmail,
    consequences,
    canDelete,
    isDeleting,
    handleSubmit,
  } = useConfirmDeleteStep({ source, onBusyChange });

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col px-0.5">
      <div className="flex flex-col gap-4">
        <Text variant="body" tone="emphasis">
          {t(
            "This closes your AutoGPT account now and erases it after 14 days.",
            "此操作将立即关闭你的 AutoGPT 账户，并在 14 天后删除账户数据。",
          )}
        </Text>
        <ConsequenceList items={consequences} />
        <div className="flex flex-col gap-2">
          <Text variant="body" id={labelID}>
            {t(`Type ${email} to confirm`, `请输入 ${email} 以确认`)}
          </Text>
          <Input
            id={inputID}
            label={
              username ? t("Username", "用户名") : t("Your email", "你的邮箱")
            }
            hideLabel
            aria-labelledby={labelID}
            type={username ? "text" : "email"}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={typedEmail}
            onChange={(event) => setTypedEmail(event.target.value)}
            disabled={isDeleting}
            className="scroll-mb-20 text-body-lg lg:text-body [@media(max-height:300px)]:scroll-mb-0"
            wrapperClassName="mb-0"
          />
          <Text variant="small" tone="muted">
            {t(
              "You'll be signed out right away. Changed your mind? Sign in within 14 days and choose Keep my account. Your plan, apps, API keys, schedules, share links, Marketplace listings and reviews don't come back, and notification emails stay off until you switch them back on.",
              "你将立即退出登录。如果改变主意，请在 14 天内登录并选择保留账户。套餐、应用连接、API 密钥、计划任务、分享链接、市场发布内容和评价不会恢复；通知邮件将保持关闭，直到你重新启用。",
            )}
          </Text>
        </div>
      </div>
      <StepFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isDeleting}
          className="flex-1 lg:flex-none"
        >
          {t("Keep account", "保留账户")}
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={!canDelete}
          loading={isDeleting}
          className="flex-1 lg:flex-none"
        >
          {t("Delete account", "删除账户")}
        </Button>
      </StepFooter>
    </form>
  );
}
