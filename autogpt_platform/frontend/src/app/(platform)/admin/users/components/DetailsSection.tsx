"use client";

import { useGetV2GetUserRateLimit } from "@/app/api/__generated__/endpoints/admin/admin";
import { okData } from "@/app/api/helpers";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { ReactNode } from "react";
import { AdminSection } from "../../components/AdminSection";
import { type AdminUser, formatDate, getPlanName } from "../helpers";

interface Props {
  user: AdminUser;
}

export function DetailsSection({ user }: Props) {
  const { t, locale } = useTranslation();
  const { toast } = useToast();
  const { data: rateLimit, isError: planFailed } = useGetV2GetUserRateLimit(
    { user_id: user.id },
    { query: { select: okData } },
  );

  async function copyUserID() {
    try {
      await navigator.clipboard.writeText(user.id);
      toast({ title: t("User ID copied", "用户 ID 已复制") });
    } catch {
      toast({
        title: t("Couldn't copy the user ID", "无法复制用户 ID"),
        description: t("Select it and copy it by hand.", "请选中后手动复制。"),
        variant: "destructive",
      });
    }
  }

  return (
    <AdminSection title={t("Details", "账户详情")}>
      <dl className="flex flex-col gap-3">
        <Row label={t("User ID", "用户 ID")}>
          <span className="flex items-start gap-1">
            <span
              className="min-w-0 font-mono text-body-sm leading-inherit break-all"
              translate="no"
            >
              {user.id}
            </span>
            <Button
              variant="icon"
              size="icon-xs"
              aria-label={t("Copy user ID", "复制用户 ID")}
              onClick={() => void copyUserID()}
            >
              <Icon icon={Copy01Icon} size={14} aria-hidden />
            </Button>
          </span>
        </Row>
        <Row label={t("Email", "邮箱")}>
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="break-all" translate="no">
              {user.email}
            </span>
            {user.emailVerified ? (
              <Badge variant="success" size="small">
                {t("Verified", "已验证")}
              </Badge>
            ) : (
              <Badge variant="warning" size="small">
                {t("Unverified", "未验证")}
              </Badge>
            )}
          </span>
        </Row>
        <Row label={t("Role", "角色")}>
          {user.role === "admin" ? t("Admin", "管理员") : t("User", "用户")}
        </Row>
        <Row label={t("Plan", "套餐")}>
          {rateLimit
            ? getPlanName(rateLimit.tier)
            : planFailed
              ? t("Couldn't load", "加载失败")
              : "—"}
        </Row>
        <Row label={t("Joined", "注册时间")}>
          {formatDate(user.createdAt, locale)}
        </Row>
        <Row label={t("Status", "状态")}>
          {user.banned ? (
            <span className="text-error-foreground">
              {user.banExpires
                ? t("Banned until", "封禁至") +
                  ` ${formatDate(user.banExpires, locale)}`
                : t("Banned permanently", "永久封禁")}
            </span>
          ) : (
            t("Active", "正常")
          )}
        </Row>
      </dl>
    </AdminSection>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Text variant="small" as="dt" className="w-[88px] shrink-0" tone="muted">
        {label}
      </Text>
      <Text variant="body" as="dd" className="min-w-0 flex-1">
        {children}
      </Text>
    </div>
  );
}
