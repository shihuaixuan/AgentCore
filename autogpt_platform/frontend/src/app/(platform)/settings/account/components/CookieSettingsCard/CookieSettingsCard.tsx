"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { openConsentSettings } from "@/services/consent/consent";
import { useConsentManagerStatus } from "@/services/consent/useConsent";

import { EASE_OUT } from "../../helpers";

interface Props {
  index?: number;
}

export function CookieSettingsCard({ index = 0 }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const status = useConsentManagerStatus();

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
      className="flex w-full flex-col"
    >
      <div className="flex items-center justify-between gap-4 rounded-large border border-border-base bg-surface px-4 py-4 shadow-message-table">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Text variant="body-medium" as="span">
            {t("Cookies", "Cookie")}
          </Text>
          <Text variant="small" as="span" tone="muted">
            {t(
              "Choose which optional cookies AutoGPT may use.",
              "选择允许 AutoGPT 使用哪些可选 Cookie。",
            )}
          </Text>
        </div>

        {status === "unavailable" ? (
          <Text
            variant="small"
            as="span"
            role="status"
            tone="muted"
            className="max-w-64 text-right"
          >
            {t(
              "Cookie settings couldn't load. A content blocker may be stopping them.",
              "无法加载 Cookie 设置。内容拦截器可能阻止了加载。",
            )}
          </Text>
        ) : (
          <Button
            type="button"
            size="small"
            variant="secondary"
            disabled={status !== "ready"}
            onClick={openConsentSettings}
          >
            {t("Cookie settings", "Cookie 设置")}
          </Button>
        )}
      </div>
    </motion.section>
  );
}
