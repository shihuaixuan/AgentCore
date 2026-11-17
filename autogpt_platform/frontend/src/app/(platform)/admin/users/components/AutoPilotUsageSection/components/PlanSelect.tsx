import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getPlanName } from "../../../helpers";
import { getPlanOptions, isAssignableTier } from "../helpers";

interface Props {
  tier: string;
  multipliers?: Record<string, number>;
  disabled: boolean;
  onPick: (tier: string) => void;
}

export function PlanSelect({ tier, multipliers, disabled, onPick }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Text variant="small-medium" as="span" aria-hidden>
        {t("Plan", "套餐")}
      </Text>
      <Select
        id="user-plan"
        label={t("Plan", "套餐")}
        hideLabel
        size="small"
        // "" keeps Radix controlled and shows the placeholder; undefined would
        // let it keep a pick the admin then cancelled.
        value={isAssignableTier(tier) ? tier : ""}
        placeholder={`${getPlanName(tier)} (${t("set by billing", "由账单系统设置")})`}
        options={getPlanOptions(multipliers).map((option) => ({
          ...option,
          label: option.label
            .replace("No plan — no AutoPilot access", t("No plan — no AutoPilot access", "无套餐 — 无 AutoPilot 权限"))
            .replace("tier limits", t("tier limits", "套餐限额"))
            .replace("base limits", t("base limits", "基础限额")),
        }))}
        onValueChange={(picked) => {
          if (picked !== tier) onPick(picked);
        }}
        disabled={disabled}
        wrapperClassName="mb-0 w-full sm:w-[260px]"
      />
    </div>
  );
}
