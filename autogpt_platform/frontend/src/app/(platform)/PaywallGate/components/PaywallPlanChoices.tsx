"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { SparklesIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  YEARLY_PRICE_FACTOR,
  type PlanDef,
} from "@/components/molecules/PlanCard/plans";

interface Props {
  plans: PlanDef[];
  cycle: "monthly" | "yearly";
  onCycle: (cycle: "monthly" | "yearly") => void;
  onSelect: (tier: string) => void;
  pending: boolean;
  selectedTier: string | null;
}

export function PaywallPlanChoices({
  plans,
  cycle,
  onCycle,
  onSelect,
  pending,
  selectedTier,
}: Props) {
  const { t } = useTranslation();
  const team = plans.find((plan) => plan.key === "BUSINESS");
  return (
    <section
      aria-label={t("Choose your AutoGPT plan", "选择你的 AutoGPT 套餐")}
      className="w-full space-y-5"
    >
      <div className="flex justify-center">
        <div
          role="group"
          aria-label={t("Billing period", "计费周期")}
          className="inline-flex rounded-full border border-border-base bg-surface-hover p-1"
        >
          {(["monthly", "yearly"] as const).map((value) => (
            <Button
              key={value}
              variant={cycle === value ? "ghost" : "ghost-muted"}
              size="small"
              aria-pressed={cycle === value}
              onClick={() => onCycle(value)}
              disabled={pending}
              className={cycle === value ? "bg-surface shadow-sm" : undefined}
            >
              {value === "monthly" ? t("Monthly", "按月") : t("Yearly", "按年")}
              {value === "yearly" && (
                <span className="text-caption text-success">
                  {t(
                    `Save ${Math.round((1 - YEARLY_PRICE_FACTOR) * 100)}%`,
                    `节省 ${Math.round((1 - YEARLY_PRICE_FACTOR) * 100)}%`,
                  )}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {plans
          .filter((plan) => plan.key !== "BUSINESS")
          .map((plan) => (
            <PlanChoice
              key={plan.key}
              plan={plan}
              cycle={cycle}
              onSelect={onSelect}
              pending={pending}
              selectedTier={selectedTier}
            />
          ))}
      </div>
      {team && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-base px-4 py-3">
          <div>
            <Text variant="small-medium">{t("Team", "团队版")}</Text>
            <Text variant="small" tone="secondary">
              {t(
                "Custom capacity for your organization.",
                "为你的组织定制使用容量。",
              )}
            </Text>
          </div>
          <Button
            variant="secondary"
            size="small"
            onClick={() => onSelect(team.key)}
          >
            {t("Talk to sales", "联系销售")}
          </Button>
        </div>
      )}
      <Text variant="small-tight" tone="secondary" className="text-center">
        {t(
          "Your conversations and workflows stay saved. Cancel anytime.",
          "对话和工作流会继续保存，可随时取消订阅。",
        )}
      </Text>
    </section>
  );
}

function PlanChoice({
  plan,
  cycle,
  onSelect,
  pending,
  selectedTier,
}: { plan: PlanDef } & Omit<Props, "plans" | "onCycle">) {
  const { t } = useTranslation();
  const amount = cycle === "yearly" ? plan.usdYearly : plan.usdMonthly;
  const formatted =
    amount == null
      ? null
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: amount % 1 ? 2 : 0,
        }).format(amount);
  const isPro = plan.key === "PRO";
  const features = isPro
    ? [
        t(
          `Experts for content, sales and research, with ${AUTOPILOT_NAME} coordinating`,
          `由 ${AUTOPILOT_NAME} 协调内容、销售和研究领域的专家`,
        ),
        t(
          "Workflows that keep working in the background on a schedule",
          "按计划在后台持续运行的工作流",
        ),
      ]
    : [
        plan.usage
          ? t(
              `${plan.usage.replace(/x|×/, "")} times the usage of Pro`,
              `Pro 套餐 ${plan.usage.replace(/x|×/, "")} 倍的使用额度`,
            )
          : t("More usage for demanding work", "为高强度工作提供更多使用额度"),
        t(
          "More file storage and priority support",
          "更多文件存储空间和优先支持",
        ),
      ];
  return (
    <section
      aria-label={t(`${plan.name} plan`, `${plan.name} 套餐`)}
      className={`flex flex-col rounded-2xl border p-5 sm:p-6 ${isPro ? "border-brand/30 bg-gradient-to-br from-accent-surface via-surface to-info-surface" : "border-border-base bg-surface"}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <Icon
          icon={SparklesIcon}
          size={18}
          tone={isPro ? "brand-strong" : "secondary"}
        />
        <Text variant="large-semibold" as="h2">
          {plan.name}
        </Text>
      </div>
      <Text variant="small" tone="secondary" className="mb-4">
        {isPro
          ? t("For the work you do every day.", "适合日常工作。")
          : t(
              "For bigger ideas and heavier work.",
              "适合更大的创意和更繁重的工作。",
            )}
      </Text>
      <div className="mb-5">
        <Text variant="h3-tracking-tight" as="span">
          {formatted ?? t("Unavailable", "暂不可用")}
        </Text>
        {formatted && (
          <Text variant="small" as="span" tone="secondary">
            {" "}
            / {cycle === "yearly" ? t("year", "年") : t("month", "月")}
          </Text>
        )}
      </div>
      <ul className="mb-6 space-y-2.5">
        {features.map((feature) => (
          <li className="flex gap-2" key={feature}>
            <Icon
              icon={Tick02Icon}
              size={15}
              tone="brand-strong"
              className="mt-0.5 shrink-0"
            />
            <Text variant="small" tone="body">
              {feature}
            </Text>
          </li>
        ))}
      </ul>
      <Button
        className="mt-auto w-full"
        variant={isPro ? "primary" : "secondary"}
        onClick={() => onSelect(plan.key)}
        loading={pending && selectedTier === plan.key}
        disabled={pending || !formatted}
      >
        {t(`Start ${plan.name}`, `开通 ${plan.name}`)}
      </Button>
    </section>
  );
}
