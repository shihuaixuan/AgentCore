"use client";

import type { AccountIPReport } from "@/app/api/__generated__/models/accountIPReport";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Text } from "@/components/atoms/Text/Text";
import { pluralize } from "../../../helpers";
import { BlockDomainDialog } from "../../AccessDialogs/BlockDomainDialog/BlockDomainDialog";
import { UnblockDialog } from "../../AccessDialogs/UnblockDialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  report: AccountIPReport;
  signedInUserId: string | undefined;
}

export function DomainLine({ report, signedInUserId }: Props) {
  const { t } = useTranslation();
  const { domain } = report;
  const name = <span className="font-medium">{domain.value}</span>;

  if (domain.is_public_provider) {
    return (
      <Text variant="body" tone="body">
        {t(
          `Email domain ${domain.value} is a public mail provider, so it isn't used to link accounts and can't be blocked.`,
          `邮箱域名 ${domain.value} 属于公共邮件服务商，因此不用于关联账户，也无法被阻止。`,
        )}
        {report.related.length > 0
          ? t(
              " The accounts below share a sign-in IP with this one.",
              " 下方账户与此账户使用相同的登录 IP。",
            )
          : null}
      </Text>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Text variant="body" tone="body">
        {t("Email domain", "邮箱域名")} {name} ·{" "}
        {domain.other_account_count > 0
          ? t(
              pluralize(domain.other_account_count, "other account"),
              `${domain.other_account_count} 个其他账户`,
            )
          : t("no other accounts", "没有其他账户")}
      </Text>
      <div className="flex items-center gap-2">
        {domain.block ? (
          <>
            <Badge variant="warning" size="small">
              {t("Blocked", "已阻止")}
            </Badge>
            <UnblockDialog block={domain.block} triggerVariant="link" />
          </>
        ) : null}
        <BlockDomainDialog
          report={report}
          signedInUserId={signedInUserId}
          showTrigger={!domain.block}
        />
      </div>
    </div>
  );
}
