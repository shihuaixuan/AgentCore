"use client";

import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import {
  BookOpen01Icon,
  FlowIcon,
  Link01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/marketplace", english: "Experts", chinese: "专家", icon: UserIcon },
  {
    href: "/marketplace/skills",
    english: "Skills",
    chinese: "技能",
    icon: BookOpen01Icon,
  },
  {
    href: "/marketplace/workflows",
    english: "Workflows",
    chinese: "工作流",
    icon: FlowIcon,
  },
  {
    href: "/marketplace/connectors",
    english: "Connectors",
    chinese: "连接器",
    icon: Link01Icon,
  },
];

export function MarketplaceNavigation() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const active = pathname?.startsWith("/marketplace/experts/")
    ? "/marketplace"
    : pathname?.startsWith("/marketplace/agent/")
      ? "/marketplace/workflows"
      : tabs.find(
          ({ href }) =>
            pathname === href ||
            (href !== "/marketplace" && pathname?.startsWith(`${href}/`)),
        )?.href;

  return (
    <nav
      aria-label={t("Marketplace resources", "市场资源")}
      className="px-4 pt-3 sm:px-8 lg:px-10"
    >
      <ul className="flex gap-2 overflow-x-auto border-b border-border-base sm:gap-5">
        {tabs.map(({ href, english, chinese, icon }) => (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              aria-current={active === href ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-t-md border-b-2 px-2 py-3 text-body font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset sm:gap-2 sm:px-3",
                active === href
                  ? "border-brand text-foreground-strong"
                  : "border-transparent text-foreground-secondary hover:bg-surface-hover hover:text-foreground-strong",
              )}
            >
              <Icon icon={icon} size={17} aria-hidden />
              {t(english, chinese)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
