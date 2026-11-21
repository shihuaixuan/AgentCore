import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { PublishAgentModal } from "@/components/contextual/PublishAgentModal/PublishAgentModal";
import { usePublishToMarketplace } from "./usePublishToMarketplace";
import { Share01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  flowID: string | null;
  flowVersion: number | null;
}

export function PublishToMarketplace({ flowID, flowVersion }: Props) {
  const { t } = useTranslation();
  const { handlePublishToMarketplace, publishState, handleStateChange } =
    usePublishToMarketplace({ flowID, flowVersion });

  const isDisabled = !flowID || flowVersion === null;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label={t("Publish to Marketplace", "发布到市场")}
        onClick={handlePublishToMarketplace}
        disabled={isDisabled}
      >
        <Icon icon={Share01Icon} className="size-4" />
      </Button>

      <PublishAgentModal
        targetState={publishState}
        onStateChange={handleStateChange}
        preSelectedAgentId={flowID || undefined}
        preSelectedAgentVersion={flowVersion ?? undefined}
        showTrigger={false}
      />
    </>
  );
}
