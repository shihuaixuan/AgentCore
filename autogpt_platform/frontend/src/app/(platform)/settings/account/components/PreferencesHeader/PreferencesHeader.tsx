"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";

import { Text } from "@/components/atoms/Text/Text";

import { EASE_OUT } from "../../helpers";

export function PreferencesHeader() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reduceMotion ? undefined : { duration: 0.32, ease: EASE_OUT }}
      className="flex min-w-0 flex-col pb-2 pl-4"
    >
      <Text variant="h4" as="h1">
        {t("Account", "账户")}
      </Text>
      <Text variant="body" tone="body" className="mt-4 max-w-[600px]">
        {t("Tune your account and time zone.", "调整账户和时区设置。")}
      </Text>
    </motion.header>
  );
}
