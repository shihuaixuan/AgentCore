import { Icon } from "@/components/atoms/Icon/Icon";
import NextLink from "next/link";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { AdminSection } from "../../components/AdminSection";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getSpendingSearchHref, getUserPlatformCostsHref } from "../helpers";

interface Props {
  userId: string;
}

export function SpendingSection({ userId }: Props) {
  const { t } = useTranslation();
  const links = [
    { label: t("Spending history", "消费记录"), href: getSpendingSearchHref(userId) },
    { label: t("Platform cost", "平台成本"), href: getUserPlatformCostsHref(userId) },
  ];

  return (
    <AdminSection title={t("Spending and cost", "消费与成本")}>
      <ul className="-mx-2 flex flex-col">
        {links.map((link) => (
          <li key={link.href}>
            <NextLink
              href={link.href}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 font-sans text-body font-medium text-foreground-base hover:bg-surface-muted focus:ring-2 focus:ring-info focus:ring-offset-2 focus:outline-none"
            >
              {link.label}
              <span className="flex text-foreground-tertiary">
                <Icon icon={ArrowUpRight01Icon} size={16} aria-hidden />
              </span>
            </NextLink>
          </li>
        ))}
      </ul>
    </AdminSection>
  );
}
