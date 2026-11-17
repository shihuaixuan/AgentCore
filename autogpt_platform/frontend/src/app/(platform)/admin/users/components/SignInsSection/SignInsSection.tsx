"use client";

import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { AdminSection } from "../../../components/AdminSection";
import { useIPReport, useOwnSessionIP } from "../../useIPReport";
import { ReportError, ReportLoading } from "../ReportStates";
import { IPRow } from "./components/IPRow";

interface Props {
  userId: string;
}

export function SignInsSection({ userId }: Props) {
  const { t } = useTranslation();
  const { report, isLoading, isForbidden, refetch } = useIPReport(userId);
  const ownIP = useOwnSessionIP();

  return (
    <AdminSection
      title={t("Sign-ins", "登录记录")}
      description={
        report
          ? t("Where this account signed up and signed in. Kept", "此账户的注册和登录记录，保留") + ` ${report.retention_days} ` + t("days.", "天。")
          : t("Where this account signed up and signed in.", "此账户的注册和登录记录。")
      }
    >
      {isLoading ? (
        <ReportLoading />
      ) : !report ? (
        <ReportError
          message={t("Couldn't load sign-ins.", "无法加载登录记录。")}
          isForbidden={isForbidden}
          onRetry={() => void refetch()}
        />
      ) : report.ips.length === 0 ? (
        <Text variant="small" tone="muted">
          {t("No sign-ins on record. The log keeps", "暂无登录记录。日志保留")}{" "}{report.retention_days}{" "}{t("days and started recently; accounts from before it show nothing until they sign in again.", "天，且启用时间较短；更早创建的账户需再次登录后才会显示记录。")}
        </Text>
      ) : (
        <div className="flex flex-col gap-2">
          {report.ips.some((ip) => ip.has_sign_up) ? null : (
            <Text variant="small" tone="muted">
              {t("Sign-up address unknown: the account predates the log.", "注册地址未知：该账户创建时间早于日志启用时间。")}
            </Text>
          )}
          <ul className="divide-y divide-border-base">
            {report.ips.map((ip) => (
              <IPRow key={ip.ip_address} ip={ip} ownIP={ownIP} />
            ))}
          </ul>
        </div>
      )}
    </AdminSection>
  );
}
