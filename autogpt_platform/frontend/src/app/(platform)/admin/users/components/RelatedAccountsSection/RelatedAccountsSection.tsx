"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { useState } from "react";
import { AdminSection } from "../../../components/AdminSection";
import type { AdminUser } from "../../helpers";
import { useIPReport, useOwnSessionIP } from "../../useIPReport";
import { BanAllDialog } from "../AccessDialogs/BanAllDialog/BanAllDialog";
import { ReportError, ReportLoading } from "../ReportStates";
import { DomainLine } from "./components/DomainLine";
import { RelatedAccountRow } from "./components/RelatedAccountRow";
import { getNoRelatedMessage } from "./helpers";

const SHOWN_AT_FIRST = 10;

interface Props {
  user: AdminUser;
}

export function RelatedAccountsSection({ user }: Props) {
  const { t } = useTranslation();
  const { report, isLoading, isForbidden, refetch } = useIPReport(user.id);
  const { user: signedInUser } = useAuth();
  const ownIP = useOwnSessionIP();
  const [showAll, setShowAll] = useState(false);

  return (
    <AdminSection
      title={t("Related accounts", "关联账户")}
      description={t("Other accounts that signed in from the same addresses or use the same email domain.", "曾从相同地址登录或使用相同邮箱域名的其他账户。")}
    >
      {isLoading ? (
        <ReportLoading />
      ) : !report ? (
        <ReportError
          message={t("Couldn't load related accounts.", "无法加载关联账户。")}
          isForbidden={isForbidden}
          onRetry={() => void refetch()}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <DomainLine report={report} signedInUserId={signedInUser?.id} />
          {report.related.length === 0 ? (
            <Text variant="small" tone="muted">
              {t(...(getNoRelatedMessage(report).split("|") as [string, string]))}
            </Text>
          ) : (
            <>
              <ul className="divide-y divide-border-base border-t border-border-base pt-2.5">
                {(showAll
                  ? report.related
                  : report.related.slice(0, SHOWN_AT_FIRST)
                ).map((account) => (
                  <RelatedAccountRow key={account.id} account={account} />
                ))}
              </ul>
              {!showAll && report.related.length > SHOWN_AT_FIRST ? (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setShowAll(true)}
                  >
                    {t("Show", "再显示")} {report.related.length - SHOWN_AT_FIRST} {t("more", "个")}
                  </Button>
                </div>
              ) : null}
              <div className="flex flex-col items-end gap-2 border-t border-border-base pt-3">
                {report.related_total > report.related.length ? (
                  <Text variant="small" tone="muted">
                    Showing {report.related.length.toLocaleString("en-GB")} of{" "}
                    {report.related_total.toLocaleString("en-GB")}. Ban all
                    covers these {report.related.length.toLocaleString("en-GB")}
                    .
                  </Text>
                ) : null}
                <BanAllDialog
                  user={user}
                  report={report}
                  signedInUserId={signedInUser?.id}
                  ownIP={ownIP}
                />
              </div>
            </>
          )}
        </div>
      )}
    </AdminSection>
  );
}
