"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { getWorkIQAdminConsentURL } from "@/lib/microsoft-setup";
import { WorkIQInstructions } from "./WorkIQInstructions";

interface Props {
  tenantID?: string;
  onRetry: () => void;
}

export function WorkIQAdminConsent({ tenantID, onRetry }: Props) {
  const { t } = useTranslation();
  const approvalURL = tenantID ? getWorkIQAdminConsentURL(tenantID) : null;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border-base p-4">
      <Text as="h3" variant="body-medium">
        {t("Set up Work IQ for your organization", "为组织设置 Work IQ")}
      </Text>
      <Text variant="small" tone="muted">
        {t(
          "Microsoft turns Work IQ on per organization, and it bills by usage. Your other Microsoft services keep working while this is pending.",
          "Microsoft 按组织启用 Work IQ，并按使用量收费。等待启用期间，其他 Microsoft 服务可继续使用。",
        )}
      </Text>
      {approvalURL && (
        <Button
          as="NextLink"
          variant="secondary"
          size="small"
          href={approvalURL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("Turn on Work IQ (admins)", "启用 Work IQ（管理员）")}
        </Button>
      )}
      <WorkIQInstructions />
      <Button variant="ghost" size="small" onClick={onRetry}>
        {t("Check again", "重新检查")}
      </Button>
    </section>
  );
}
