"use client";

import { useGetAdminGetUserOrganizations } from "@/app/api/__generated__/endpoints/admin/admin";
import { okData } from "@/app/api/helpers";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { AdminSection } from "../../components/AdminSection";
import { formatMonth } from "../helpers";

interface Props {
  userId: string;
}

export function OrganisationsSection({ userId }: Props) {
  const { t, locale } = useTranslation();
  const {
    data: organisations,
    isLoading,
    refetch,
  } = useGetAdminGetUserOrganizations(userId, { query: { select: okData } });

  return (
    <AdminSection
      title={t("Organisations", "组织")}
      description={t(
        "Every account has a personal organisation.",
        "每个账户都有一个个人组织。",
      )}
    >
      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : !organisations ? (
        <div className="flex items-center justify-between gap-4">
          <Text variant="small" tone="muted">
            {t("Couldn't load organisations.", "无法加载组织。")}
          </Text>
          <Button
            variant="secondary"
            size="small"
            onClick={() => void refetch()}
          >
            {t("Retry", "重试")}
          </Button>
        </div>
      ) : organisations.length === 0 ? (
        <Text variant="small" tone="muted">
          {t("No organisations.", "暂无组织。")}
        </Text>
      ) : (
        <ul className="divide-y divide-border-base">
          {organisations.map((organisation) => (
            <li
              key={organisation.id}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                <Text variant="body-medium" as="span" className="truncate">
                  {organisation.name}
                </Text>
                <Text
                  variant="small-mono"
                  as="span"
                  tone="muted"
                  translate="no"
                >
                  {organisation.slug}
                </Text>
                {organisation.is_personal ? (
                  <Badge variant="info" size="small">
                    {t("Personal", "个人")}
                  </Badge>
                ) : null}
              </div>
              <Text variant="small" as="span" className="shrink-0" tone="muted">
                {formatMonth(new Date(organisation.created_at), locale)}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </AdminSection>
  );
}
