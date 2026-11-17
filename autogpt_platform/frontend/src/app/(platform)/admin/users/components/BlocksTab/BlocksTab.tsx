"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { ToggleChip } from "@/components/atoms/ToggleChip/ToggleChip";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { SearchInput } from "@/components/molecules/SearchInput/SearchInput";
import {
  GlobeIcon,
  MailAtSign01Icon,
  SecurityBlockIcon,
} from "@hugeicons/core-free-icons";
import { AdminSection } from "../../../components/AdminSection";
import { getErrorMessage } from "../../helpers";
import { BlockRow } from "./components/BlockRow";
import { type KindFilter, useBlocksTab } from "./useBlocksTab";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const KIND_CHIPS: Array<{
  value: KindFilter;
  label: string;
  icon: typeof GlobeIcon;
}> = [
  { value: "all", label: "All", icon: SecurityBlockIcon },
  { value: "IP", label: "IP addresses", icon: GlobeIcon },
  { value: "EMAIL_DOMAIN", label: "Domains", icon: MailAtSign01Icon },
];

export function BlocksTab() {
  const { t } = useTranslation();
  const tab = useBlocksTab();

  if (tab.isLoading) {
    return (
      <AdminSection>
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </AdminSection>
    );
  }
  if (tab.isError) {
    return (
      <ErrorCard
        context="blocks"
        responseError={{ message: getErrorMessage(tab.error) }}
        onRetry={() => void tab.refetch()}
      />
    );
  }
  if (tab.blocks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <span className="flex text-foreground-subtle">
          <Icon icon={SecurityBlockIcon} size={32} />
        </span>
        <Text variant="large-medium">{t("No active blocks", "没有生效的拦截规则")}</Text>
        <Text variant="body" className="max-w-[420px]" tone="secondary">
          {t("Block an address from an account's Sign-ins, or an email domain from its Related accounts.", "可在账户的“登录记录”中拦截地址，或在“关联账户”中拦截邮箱域名。")}
        </Text>
      </div>
    );
  }

  return (
    <AdminSection>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <SearchInput
            size="small"
            value={tab.search}
            onChange={tab.setSearch}
            placeholder={t("Filter by address, domain or reason", "按地址、域名或原因筛选")}
            aria-label={t("Filter blocks", "筛选拦截规则")}
          />
        </div>
        <div className="flex items-center gap-1 rounded-full bg-surface-hover p-0.5">
          {KIND_CHIPS.map((chip) => (
            <ToggleChip
              key={chip.value}
              icon={<Icon icon={chip.icon} size={14} />}
              label={t(chip.label, chip.value === "all" ? "全部" : chip.value === "IP" ? "IP 地址" : "域名")}
              tooltip={`${t("Show", "显示")} ${t(chip.label, chip.value === "all" ? "全部" : chip.value === "IP" ? "IP 地址" : "域名")}`}
              ariaLabel={t(chip.label, chip.value === "all" ? "全部" : chip.value === "IP" ? "IP 地址" : "域名")}
              pressed={tab.kind === chip.value}
              onToggle={() => tab.setKind(chip.value)}
            />
          ))}
        </div>
      </div>
      {tab.visible.length === 0 ? (
        <Text variant="small" tone="muted">
          {t("No blocks match.", "没有匹配的拦截规则。")}
        </Text>
      ) : (
        <ul className="divide-y divide-border-base">
          {tab.visible.map((block) => (
            <BlockRow key={block.id} block={block} />
          ))}
        </ul>
      )}
      {tab.hasMore ? (
        <div className="mt-3 flex justify-center">
          <Button variant="ghost" size="small" onClick={tab.showMore}>
            {t("Show 50 more", "再显示 50 条")}
          </Button>
        </div>
      ) : null}
    </AdminSection>
  );
}
