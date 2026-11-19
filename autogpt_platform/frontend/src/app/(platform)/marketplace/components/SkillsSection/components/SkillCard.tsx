"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { MarketplaceSkill } from "@/app/api/__generated__/models/marketplaceSkill";
import { Icon } from "@/components/atoms/Icon/Icon";
import { IntegrationLogo } from "@/components/molecules/IntegrationLogo/IntegrationLogo";
import { formatProviderName } from "@/components/contextual/IntegrationsPanel/helpers";
import { cn } from "@/lib/utils";
import {
  ArrowRight02Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Download04Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { getCategoryAccent } from "../../ExpertsSection/helpers";
import { formatCategoryLabel } from "../helpers";

interface Props {
  skill: MarketplaceSkill;
  isInstalled: boolean;
  categoryLabel?: string;
}

export function SkillCard({ skill, isInstalled, categoryLabel }: Props) {
  const { t, locale } = useTranslation();
  const { accent, icon } = getCategoryAccent(skill.categories[0]);
  const title = skill.title;
  const providers = skill.required_providers;

  return (
    <Link
      href={`/marketplace/skills/${skill.slug}`}
      data-testid="skill-card"
      // oxlint-disable-next-line design-system/no-arbitrary-values -- the card's hover lift shadow has no shadow token
      className="group relative flex h-full [touch-action:manipulation] flex-col overflow-hidden rounded-2xl border border-border-base/80 bg-surface text-left shadow-message-table transition-[transform,box-shadow,border-color] duration-200 ease-out outline-none hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_16px_40px_-16px_rgba(16,24,40,0.18)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:transform-none"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-28 opacity-60 transition-opacity duration-200 group-hover:opacity-100",
          accent.wash,
        )}
      />
      <div className="relative flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface ring-1 ring-border-base/70 ring-inset",
              accent.icon,
            )}
          >
            <Icon icon={BookOpen01Icon} size={24} aria-hidden />
          </span>
          {skill.categories[0] ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-body font-medium",
                accent.pill,
              )}
            >
              {icon && <Icon icon={icon} size={14} aria-hidden />}
              {categoryLabel ??
                formatCategoryLabel(skill.categories[0], locale)}
            </span>
          ) : null}
        </div>

        <div className="min-w-0">
          <h3
            title={title}
            className="line-clamp-1 text-lead font-semibold tracking-title text-foreground-strong"
          >
            {title}
          </h3>
          {providers.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-body-sm leading-inherit text-foreground-tertiary">
              {t("Works with", "适用服务")}
              <IntegrationLogo provider={providers[0]} size={14} alt="" />
              {formatProviderList(providers, locale)}
            </div>
          )}
          <p className="mt-2 line-clamp-3 text-body leading-relaxed text-foreground-secondary">
            {skill.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-center gap-2 text-body-lg text-foreground-secondary">
            <Icon
              icon={Download04Icon}
              size={18}
              // oxlint-disable-next-line design-system/require-static-classes -- the glyph wears the skill's category accent
              className={accent.icon}
              aria-hidden
            />
            {/* Nobody having installed it yet makes a listing new, not failing. */}
            {skill.install_count === 0
              ? t("New", "新建")
              : t(
                  `${skill.install_count.toLocaleString(locale)} installed`,
                  `已安装 ${skill.install_count.toLocaleString(locale)} 次`,
                )}
          </span>
          {isInstalled ? (
            <span className="flex items-center gap-1.5 text-body-lg font-medium text-success">
              <Icon icon={CheckmarkCircle02Icon} size={18} aria-hidden />

              {t("Added", "已添加")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-body-lg font-medium text-foreground-tertiary transition-colors duration-200 group-hover:text-foreground-strong">
              {t("View", "查看")}
              <Icon
                icon={ArrowRight02Icon}
                size={16}
                aria-hidden
                motion="transform"
                className="group-hover:translate-x-0.5"
              />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatProviderList(providers: string[], locale: string): string {
  const names = providers.map(formatProviderName).filter(Boolean);
  return new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).format(names);
}
