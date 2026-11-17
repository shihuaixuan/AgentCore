"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { PublishAgentModal } from "@/components/contextual/PublishAgentModal/PublishAgentModal";
import type { PublishState } from "@/components/contextual/PublishAgentModal/usePublishAgentModal";
import type { StoreSubmission } from "@/app/api/__generated__/models/storeSubmission";

import { EASE_OUT } from "../../helpers";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  publishState: PublishState;
  onPublishStateChange: (state: PublishState) => void;
  onOpenSubmit: () => void;
  onRequestEdit?: (submission: StoreSubmission) => void;
}

export function DashboardHeader({
  publishState,
  onPublishStateChange,
  onOpenSubmit,
  onRequestEdit,
}: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reduceMotion ? undefined : { duration: 0.32, ease: EASE_OUT }}
      className="flex flex-col gap-5 pr-1 pb-2 pl-4 md:flex-row md:items-end md:justify-between"
    >
      <div className="flex min-w-0 flex-col">
        <Text variant="h4" as="h1">
          {t("Creator dashboard", "创作者面板")}
        </Text>
        <Text variant="body" tone="body" className="mt-3 max-w-[640px]">
          {t(
            "Track your store submissions, see how they perform, and ship updates for the workflows you publish.",
            "跟踪市场提交记录、查看表现，并更新已发布的工作流。",
          )}
        </Text>
      </div>

      <PublishAgentModal
        targetState={publishState}
        onStateChange={onPublishStateChange}
        onRequestEdit={onRequestEdit}
        trigger={
          <Button
            data-testid="submit-agent-button"
            size="large"
            onClick={onOpenSubmit}
            leftIcon={<Icon icon={PlusSignIcon} size={18} />}
          >
            {t("Submit workflow", "提交工作流")}
          </Button>
        }
      />
    </motion.header>
  );
}
