import type { ProviderCostSummary } from "@/app/api/__generated__/models/providerCostSummary";
import {
  defaultRateFor,
  estimateCostForRow,
  formatMicrodollars,
  formatTokens,
  rateKey,
  rateUnitLabel,
  trackingValue,
} from "../helpers";
import { TrackingBadge } from "./TrackingBadge";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  data: ProviderCostSummary[];
  rateOverrides: Record<string, number>;
  onRateOverride: (key: string, val: number | null) => void;
}

function ProviderTable({ data, rateOverrides, onRateOverride }: Props) {
  const { t, locale } = useTranslation();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-body">
        <thead className="border-b text-caption text-foreground-tertiary uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">
              {t("Provider", "服务提供商")}
            </th>
            <th scope="col" className="px-4 py-3">
              {t("Model", "模型")}
            </th>
            <th scope="col" className="px-4 py-3">
              {t("Type", "类型")}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              {t("Usage", "使用量")}
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right"
              title={t(
                "Only populated for token-tracking providers (e.g. LLM calls). Non-token rows (per_run, characters, etc.) show —.",
                "仅按令牌计量的服务提供商（例如 LLM 调用）有此数据。其他计量类型（per_run、characters 等）显示 —。",
              )}
            >
              {t("Input Tokens", "输入令牌")}
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right"
              title={t(
                "Only populated for token-tracking providers (e.g. LLM calls). Non-token rows (per_run, characters, etc.) show —.",
                "仅按令牌计量的服务提供商（例如 LLM 调用）有此数据。其他计量类型（per_run、characters 等）显示 —。",
              )}
            >
              {t("Output Tokens", "输出令牌")}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              {t("Requests", "请求数")}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              {t("Known Cost", "已知成本")}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              {t("Est. Cost", "估算成本")}
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right"
              title={t("Per-session only", "仅在当前会话有效")}
            >
              {t("Rate", "费率")}{" "}
              <span className="text-tiny leading-inherit font-normal">
                {t("(unsaved)", "（未保存）")}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const est = estimateCostForRow(row, rateOverrides);
            const tt = row.tracking_type || "per_run";
            // For cost_usd rows the provider reports USD directly so rate
            // input doesn't apply; otherwise show an editable input.
            const showRateInput = tt !== "cost_usd";
            const key = rateKey(row.provider, tt, row.model);
            const fallback = defaultRateFor(row.provider, tt);
            const currentRate = rateOverrides[key] ?? fallback;
            return (
              <tr
                key={`${row.provider}:${tt}:${row.model ?? ""}`}
                className="border-b hover:bg-surface-hover"
              >
                <td className="px-4 py-3 font-medium">{row.provider}</td>
                <td className="px-4 py-3 text-foreground-tertiary">
                  {row.model || "—"}
                </td>
                <td className="px-4 py-3">
                  <TrackingBadge trackingType={row.tracking_type} />
                </td>
                <td className="px-4 py-3 text-right">
                  {trackingValue(row, locale)}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.total_input_tokens > 0
                    ? formatTokens(row.total_input_tokens)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.total_output_tokens > 0
                    ? formatTokens(row.total_output_tokens)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.request_count.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.total_cost_microdollars > 0
                    ? formatMicrodollars(row.total_cost_microdollars)
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  {est !== null ? (
                    formatMicrodollars(est)
                  ) : (
                    <span className="text-foreground-tertiary">-</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {showRateInput ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        aria-label={t(
                          `Rate for ${row.provider} (${tt})`,
                          `${row.provider}（${tt}）的费率`,
                        )}
                        className="w-24 rounded border px-2 py-1 text-right text-caption"
                        placeholder={fallback !== null ? String(fallback) : "0"}
                        value={currentRate ?? ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) onRateOverride(key, val);
                          else if (e.target.value === "")
                            onRateOverride(key, null);
                        }}
                      />
                      <span
                        className="text-tiny leading-inherit text-foreground-tertiary"
                        title={rateUnitLabel(tt, locale)}
                      >
                        {rateUnitLabel(tt, locale)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-caption text-foreground-tertiary">
                      {t("auto", "自动")}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={10}
                className="px-4 py-8 text-center text-foreground-tertiary"
              >
                {t("No cost data yet", "暂无成本数据")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export { ProviderTable };
