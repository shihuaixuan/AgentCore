import type { CredentialRejection } from "@/app/api/__generated__/models/credentialRejection";
import { AttentionCard } from "@/components/organisms/AttentionCard/AttentionCard";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  rejection: CredentialRejection;
}

export function CredentialRejectionNotice({ rejection }: Props) {
  const { t } = useTranslation();
  return (
    <AttentionCard.Root variant="error" density="snug" role="alert">
      {rejection.credential_title
        ? t(
            `"${rejection.credential_title}" was refused`,
            `凭据 "${rejection.credential_title}" 被拒绝`,
          )
        : t("The saved credential was refused", "已保存的凭据被拒绝")}
      {rejection.status_code ? ` — HTTP ${rejection.status_code}` : ""}
      <p className="mt-1 break-words opacity-80">{rejection.detail}</p>
    </AttentionCard.Root>
  );
}
