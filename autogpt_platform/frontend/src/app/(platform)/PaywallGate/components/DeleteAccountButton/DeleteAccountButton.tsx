import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { DeleteAccountFlow } from "@/components/organisms/DeleteAccountFlow/DeleteAccountFlow";
import { useDeleteAccountFlowOpener } from "@/components/organisms/DeleteAccountFlow/useDeleteAccountFlowOpener";
import { UserRemove01Icon } from "@hugeicons/core-free-icons";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// Rendered inside the paywall's Dialog.Content, so the flow is a nested Radix
// dialog: it opens as the top layer over the force-open paywall, and Radix
// counts clicks and focus inside it as inside the paywall.
export function DeleteAccountButton() {
  const { t } = useTranslation();
  const { isFlowOpen, openFlow, handleFlowOpenChange } =
    useDeleteAccountFlowOpener("paywall");

  return (
    <>
      <Button
        variant="ghost-muted"
        size="small"
        onClick={openFlow}
        leftIcon={<Icon icon={UserRemove01Icon} size={16} />}
      >
        {t("Delete account", "删除账户")}
      </Button>
      <DeleteAccountFlow
        source="paywall"
        open={isFlowOpen}
        onOpenChange={handleFlowOpenChange}
      />
    </>
  );
}
