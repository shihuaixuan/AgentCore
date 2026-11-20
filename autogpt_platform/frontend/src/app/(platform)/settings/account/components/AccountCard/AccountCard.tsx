"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { User } from "@/lib/auth/types";
import { identityUsername } from "@/lib/auth/local-username";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/molecules/Form/Form";

import { EASE_OUT } from "../../helpers";
import { useAccountCard } from "./useAccountCard";
import { PencilIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  user: User;
  emailSettingsEnabled: boolean;
  index?: number;
}

export function AccountCard({ user, emailSettingsEnabled, index = 0 }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const { emailForm, onSubmitEmail, isUpdatingEmail, currentEmail } =
    useAccountCard({ user });

  const watchedEmail = emailForm.watch("email");
  const username = identityUsername(currentEmail);
  const emailHasError = Object.keys(emailForm.formState.errors).length > 0;
  const isSameEmail = watchedEmail === currentEmail;
  const disableEmailSubmit = emailHasError || isSameEmail;

  async function handleEmailSubmit(values: { email: string }) {
    if (disableEmailSubmit) return;
    const didUpdate = await onSubmitEmail(values);
    if (didUpdate) {
      setEmailDialogOpen(false);
    }
  }

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 0.32,
              ease: EASE_OUT,
              delay: 0.04 + index * 0.05,
            }
      }
      className="flex w-full flex-col gap-2"
    >
      <div className="flex flex-col divide-y divide-border-base rounded-large border border-border-base bg-surface shadow-message-table">
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <Text variant="body-medium" as="span">
            {emailSettingsEnabled
              ? t("Email", "电子邮箱")
              : username
                ? t("Username", "用户名")
                : t("Account ID", "账号 ID")}
          </Text>

          <div className="flex min-w-0 items-center gap-3">
            <Text variant="body" as="span" className="min-w-0 truncate">
              {emailSettingsEnabled ? currentEmail : (username ?? user.id)}
            </Text>

            {emailSettingsEnabled && (
              <Dialog
                title={t("Update email", "更新邮箱")}
                styling={{ maxWidth: "420px" }}
                controlled={{
                  isOpen: emailDialogOpen,
                  set: (open) => {
                    setEmailDialogOpen(open);
                    if (open) emailForm.reset({ email: currentEmail });
                  },
                }}
              >
                <Dialog.Trigger>
                  <Button
                    variant="secondary"
                    size="icon-xs"
                    shape="pill"
                    withTooltip={false}
                    aria-label={t("Edit email", "修改邮箱")}
                  >
                    <Icon icon={PencilIcon} size={14} />
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content>
                  <Form form={emailForm} onSubmit={handleEmailSubmit}>
                    <div className="flex flex-col gap-4">
                      <Text variant="small" as="span" tone="muted">
                        {t(
                          "We'll send a confirmation link to verify your new address.",
                          "我们将发送确认链接，以验证你的新邮箱地址。",
                        )}
                      </Text>
                      <FormField
                        control={emailForm.control}
                        name="email"
                        render={({ field, fieldState }) => (
                          // oxlint-disable-next-line design-system/no-restyle -- the email field sits flush under its hint
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                id={field.name}
                                label={t("Email", "电子邮箱")}
                                type="email"
                                autoComplete="email"
                                size="medium"
                                className="w-full"
                                wrapperClassName="!mb-0"
                                error={fieldState.error?.message}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Dialog.Footer>
                      <Button
                        type="button"
                        variant="ghost"
                        size="small"
                        onClick={() => setEmailDialogOpen(false)}
                      >
                        {t("Cancel", "取消")}
                      </Button>
                      <Button
                        type="submit"
                        size="small"
                        disabled={disableEmailSubmit}
                        loading={isUpdatingEmail}
                      >
                        {isUpdatingEmail
                          ? t("Saving", "正在保存")
                          : t("Update email", "更新邮箱")}
                      </Button>
                    </Dialog.Footer>
                  </Form>
                </Dialog.Content>
              </Dialog>
            )}
          </div>
        </div>

        {emailSettingsEnabled && (
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <Text variant="body-medium" as="span">
              {t("Password", "密码")}
            </Text>

            <Button
              as="NextLink"
              href="/reset-password"
              size="small"
              variant="secondary"
            >
              {t("Reset password", "重置密码")}
            </Button>
          </div>
        )}
      </div>
    </motion.section>
  );
}
