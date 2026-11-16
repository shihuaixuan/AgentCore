"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { StepFooter } from "./StepFooter";
import {
  ArrowRight02Icon,
  NoteEditIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  onDone: () => void;
  onViewProgress: () => void;
  onEdit?: () => void;
  isApproved: boolean;
  isRejected: boolean;
  isDraft: boolean;
  isPending: boolean;
  isDashboardPage: boolean;
  marketplaceUrl?: string;
}

export function ReviewStepFooter({
  onDone,
  onViewProgress,
  onEdit,
  isApproved,
  isRejected,
  isDraft,
  isPending,
  isDashboardPage,
  marketplaceUrl,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="mt-8 w-full">
      <StepFooter
        secondary={
          <>
            {onEdit && isPending ? (
              <Button
                variant="ghost"
                size="small"
                onClick={onEdit}
                className="w-full sm:w-auto"
                leftIcon={<Icon icon={NoteEditIcon} size={14} />}
                data-testid="edit-submission-button"
              >
                {t("Edit details", "编辑详情")}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="small"
              onClick={onDone}
              className="w-full sm:w-auto"
            >
              {t("Done", "完成")}
            </Button>
          </>
        }
        primary={
          isApproved && marketplaceUrl ? (
            <Button
              as="NextLink"
              href={marketplaceUrl}
              size="small"
              className="w-full sm:w-auto"
              rightIcon={<Icon icon={Store01Icon} size={14} />}
              data-testid="view-marketplace-button"
            >
              {t("View on marketplace", "在市场中查看")}
            </Button>
          ) : isRejected || isDraft || isDashboardPage ? null : (
            <Button
              size="small"
              onClick={onViewProgress}
              className="w-full sm:w-auto"
              rightIcon={<Icon icon={ArrowRight02Icon} size={14} />}
              data-testid="view-progress-button"
            >
              {t("Go to Creator Dashboard", "前往创作者控制台")}
            </Button>
          )
        }
      />
    </div>
  );
}
