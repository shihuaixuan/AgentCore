import { BlockCost } from "@/app/api/__generated__/models/blockCost";
import { BlockCostType } from "@/app/api/__generated__/models/blockCostType";
import { Text } from "@/components/atoms/Text/Text";
import useCredits from "@/hooks/useCredits";
import { useIsBillingEnabled } from "@/hooks/useIsBillingEnabled";
import { isCostFilterMatch } from "../../../../helper";
import { useNodeStore } from "@/app/(platform)/build/stores/nodeStore";
import { useShallow } from "zustand/react/shallow";
import { Coins02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { DisplayTranslate } from "../../../../../helpers/translation";

type CostDisplay =
  | { kind: "free" }
  | {
      kind: "token-rate";
      input: number;
      output: number;
      cacheRead: number | null;
      cacheCreation: number | null;
    }
  | { kind: "by-usd" }
  | { kind: "fixed"; amountText: string; suffix: string; note?: string }
  | { kind: "per-unit"; amountText: string; suffix: string; note?: string };

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function tokenRateTooltip(
  rate: {
    input: number;
    output: number;
    cacheRead: number | null;
    cacheCreation: number | null;
  },
  t: DisplayTranslate,
): string {
  const parts = [
    t(
      `Input: ${formatUsd(rate.input)} / 1M tokens`,
      `输入：${formatUsd(rate.input)} / 百万 token`,
    ),
    t(
      `Output: ${formatUsd(rate.output)} / 1M tokens`,
      `输出：${formatUsd(rate.output)} / 百万 token`,
    ),
  ];
  if (rate.cacheRead != null)
    parts.push(
      t(
        `Cached input: ${formatUsd(rate.cacheRead)} / 1M tokens`,
        `缓存读取：${formatUsd(rate.cacheRead)} / 百万 token`,
      ),
    );
  if (rate.cacheCreation != null)
    parts.push(
      t(
        `Cache write: ${formatUsd(rate.cacheCreation)} / 1M tokens`,
        `缓存写入：${formatUsd(rate.cacheCreation)} / 百万 token`,
      ),
    );
  parts.push(
    t(
      "Final charge scales with real usage (1.5× margin applied).",
      "最终费用按实际用量计算（按 1.5× 系数加价）。",
    ),
  );
  return parts.join(" · ");
}

function getDisplay(
  blockCost: BlockCost,
  formatCredits: (n: number | null) => string,
  t: DisplayTranslate,
): CostDisplay {
  // Token-rate pair takes precedence regardless of cost_type so that
  // OpenRouter (COST_USD)-billed models show the same "$X / $Y per 1M"
  // format as direct-billed providers when we have a published rate.
  // The internal billing path (TOKENS vs COST_USD) is not user-facing.
  if (blockCost.token_rate) {
    return {
      kind: "token-rate",
      input: blockCost.token_rate.input_usd_per_1m,
      output: blockCost.token_rate.output_usd_per_1m,
      cacheRead: blockCost.token_rate.cache_read_usd_per_1m ?? null,
      cacheCreation: blockCost.token_rate.cache_creation_usd_per_1m ?? null,
    };
  }

  if (blockCost.cost_type === BlockCostType.cost_usd) {
    return { kind: "by-usd" };
  }

  if (
    blockCost.cost_type === BlockCostType.run &&
    blockCost.cost_amount === 0
  ) {
    return { kind: "free" };
  }

  const divisor = blockCost.cost_divisor;
  const amountText = formatCredits(blockCost.cost_amount);

  switch (blockCost.cost_type) {
    case BlockCostType.run:
      return { kind: "fixed", amountText, suffix: t("/run", "/次运行") };
    case BlockCostType.byte:
      return { kind: "per-unit", amountText, suffix: t("/byte", "/字节") };
    case BlockCostType.second:
      return {
        kind: "per-unit",
        amountText,
        suffix:
          divisor && divisor > 1
            ? t(`/ ${divisor}s`, `/ ${divisor} 秒`)
            : t("/sec", "/秒"),
      };
    case BlockCostType.items:
      return {
        kind: "per-unit",
        amountText,
        suffix:
          divisor && divisor > 1
            ? t(`/ ${divisor} items`, `/ ${divisor} 项`)
            : t("/item", "/项"),
      };
    case BlockCostType.tokens:
      return {
        kind: "fixed",
        amountText,
        suffix: t("/run", "/次运行"),
        note: t(
          "Pre-flight flat estimate — per-token rate not in our catalog yet.",
          "运行前的固定费用预估，目录中尚无每 token 费率。",
        ),
      };
    default:
      return { kind: "fixed", amountText, suffix: `/${blockCost.cost_type}` };
  }
}

export const NodeCost = ({
  blockCosts,
  nodeId,
}: {
  blockCosts: BlockCost[];
  nodeId: string;
}) => {
  const { t } = useTranslation();
  const { formatCredits } = useCredits();
  const isBillingEnabled = useIsBillingEnabled();
  const hardcodedValues = useNodeStore(
    useShallow((state) => state.getHardCodedValues(nodeId)),
  );

  const blockCost =
    blockCosts &&
    blockCosts.find((cost) =>
      isCostFilterMatch(cost.cost_filter, hardcodedValues),
    );

  if (!isBillingEnabled || !blockCost) return null;

  const display = getDisplay(blockCost, formatCredits, t);

  if (display.kind === "free") {
    return (
      <div className="mr-3 flex items-center gap-1">
        <Icon icon={Coins02Icon} className="h-3 w-3" />
        <Text variant="small-medium">{t("Free", "免费")}</Text>
      </div>
    );
  }

  if (display.kind === "token-rate") {
    return (
      <div
        className="mr-3 flex items-center gap-1"
        title={tokenRateTooltip(display, t)}
      >
        <Icon icon={Coins02Icon} className="h-3 w-3" />
        <Text variant="small-medium">
          {t(
            `${formatUsd(display.input)} in / ${formatUsd(display.output)} out`,
            `${formatUsd(display.input)} 输入 / ${formatUsd(display.output)} 输出`,
          )}
        </Text>
        <Text variant="small">{t(" per 1M tokens", "每百万 token")}</Text>
      </div>
    );
  }

  if (display.kind === "by-usd") {
    return (
      <div
        className="mr-3 flex items-center gap-1"
        title={t(
          "Pay-as-you-go pricing. Final charge matches the provider's per-token rate plus a 1.5× margin.",
          "按量付费，最终费用按供应商的每 token 费率及 1.5× 加价系数计算。",
        )}
      >
        <Icon icon={Coins02Icon} className="h-3 w-3" />
        <Text variant="small">{t("Pay-as-you-go", "按量付费")}</Text>
      </div>
    );
  }

  return (
    <div className="mr-3 flex items-center gap-1" title={display.note}>
      <Icon icon={Coins02Icon} className="h-3 w-3" />
      <Text variant="small-medium">{display.amountText}</Text>
      <Text variant="small">{` ${display.suffix}`}</Text>
    </div>
  );
};
