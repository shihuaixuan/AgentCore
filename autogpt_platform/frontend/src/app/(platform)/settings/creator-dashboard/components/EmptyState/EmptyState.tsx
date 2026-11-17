"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";

import { Text } from "@/components/atoms/Text/Text";

import { EASE_OUT } from "../../helpers";
import { Rocket01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

export function EmptyState() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reduceMotion ? undefined : { duration: 0.28, ease: EASE_OUT }}
      className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center text-foreground-subtle"
    >
      <Icon icon={Rocket01Icon} size={28} />
      <Text variant="body-medium">
        {t("No submissions yet", "暂无提交记录")}
      </Text>
      <Text variant="small" tone="muted" className="max-w-[460px]">
        {t(
          "Once you submit a workflow to the store, it'll show up here with its status, runs, and reviews.",
          "将工作流提交到市场后，其状态、运行记录和评价会显示在这里。",
        )}
      </Text>
    </motion.div>
  );
}
