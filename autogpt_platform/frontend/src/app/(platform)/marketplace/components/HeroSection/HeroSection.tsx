"use client";

import { FilterChips } from "../FilterChips/FilterChips";
import { SearchBar } from "../SearchBar/SearchBar";
import { useHeroSection } from "./useHeroSection";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export const HeroSection = () => {
  const { t } = useTranslation();
  const { onFilterChange, searchTerms } = useHeroSection();

  return (
    <div className="mt-10 mb-16 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        <h1 className="mb-3 text-center text-heading leading-none font-semibold tracking-heading text-foreground-strong md:text-display md:leading-12">
          {t("Hire an AI expert", "聘请 AI 专家")}
          <span className="block">
            {t("for", "加入")}{" "}
            <span className="text-brand">{t("your team", "你的团队")}</span>
          </span>
        </h1>
        <p className="mb-8 text-center text-body-md leading-inherit text-foreground-tertiary md:text-lead">
          {t(
            "Ready-made specialists who bring their own skills and workflows",
            "自带技能和工作流的专业助手",
          )}
          <span className="block">
            {t("— working in minutes.", "——几分钟内即可开始工作。")}
          </span>
        </p>
        <div className="mb-4 flex w-full justify-center">
          <SearchBar />
        </div>
        <div className="flex justify-center">
          <FilterChips
            badges={searchTerms}
            onFilterChange={onFilterChange}
            multiSelect={false}
          />
        </div>
      </div>
    </div>
  );
};
