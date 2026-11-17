"use client";
import { Button } from "@/components/atoms/Button/Button";
import { buildEstimatesJson, downloadJson } from "../helpers";
import { useBlockCostEstimates } from "./useBlockCostEstimates";
import { Download04Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function BlockCostEstimatesContent() {
  const { t } = useTranslation();
  const {
    start,
    end,
    minSamples,
    data,
    loading,
    setStart,
    setEnd,
    setMinSamples,
    fetchEstimates,
  } = useBlockCostEstimates();

  function handleDownload() {
    if (!data) return;
    const generatedAtIso =
      data.generated_at instanceof Date
        ? data.generated_at.toISOString()
        : String(data.generated_at);
    const json = buildEstimatesJson(
      data.estimates,
      generatedAtIso,
      data.window_days,
    );
    downloadJson(json, `block_preflight_estimates_${start}_${end}.json`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded border p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="bce-start" className="text-body">
            {t("Start date (UTC)", "开始日期（UTC）")}
          </label>
          <input
            id="bce-start"
            type="date"
            className="rounded border px-3 py-1.5 text-body"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bce-end" className="text-body">
            {t("End date (UTC)", "结束日期（UTC）")}
          </label>
          <input
            id="bce-end"
            type="date"
            className="rounded border px-3 py-1.5 text-body"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bce-min-samples" className="text-body">
            {t("Min samples", "最小样本数")}
          </label>
          <input
            id="bce-min-samples"
            type="number"
            min={1}
            className="w-28 rounded border px-3 py-1.5 text-body"
            value={minSamples}
            onChange={(e) =>
              setMinSamples(Math.max(1, Number(e.target.value) || 1))
            }
          />
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={fetchEstimates}
          loading={loading}
        >
          {t("Aggregate", "汇总")}
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={handleDownload}
          disabled={!data || data.total_rows === 0}
          leftIcon={<Icon icon={Download04Icon} />}
        >
          {t("Download JSON", "下载 JSON")}
        </Button>
      </div>

      {data ? (
        <div className="flex flex-col gap-2">
          <p className="text-body text-foreground-tertiary">
            {data.total_rows} blocks · window {data.window_days}d (cap{" "}
            {data.max_window_days}d) · min samples {data.min_samples} ·
            generated{" "}
            {data.generated_at instanceof Date
              ? data.generated_at.toISOString()
              : String(data.generated_at)}
          </p>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-body">
              <thead className="bg-surface-hover/50">
                <tr>
                  <th className="p-2 text-left">{t("Block ID", "模块 ID")}</th>
                  <th className="p-2 text-left">{t("Block name", "模块名称")}</th>
                  <th className="p-2 text-left">{t("Cost type", "成本类型")}</th>
                  <th className="p-2 text-right">{t("Samples", "样本数")}</th>
                  <th className="p-2 text-right">{t("Mean (credits)", "平均值（额度）")}</th>
                  <th className="p-2 text-right">P50</th>
                  <th className="p-2 text-right">P95</th>
                </tr>
              </thead>
              <tbody>
                {data.estimates.map((r) => (
                  <tr key={r.block_id} className="border-t">
                    <td className="p-2 font-mono text-caption">{r.block_id}</td>
                    <td className="p-2">{r.block_name}</td>
                    <td className="p-2">{r.cost_type}</td>
                    <td className="p-2 text-right">{r.samples}</td>
                    <td className="p-2 text-right font-semibold">
                      {r.mean_credits}
                    </td>
                    <td className="p-2 text-right">{r.p50_credits}</td>
                    <td className="p-2 text-right">{r.p95_credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-body text-foreground-tertiary">
          {t("Pick a window and click Aggregate to compute per-block average credits-per-execution.", "选择时间范围并点击“汇总”，计算每个模块的平均每次执行额度。")}
        </p>
      )}
    </div>
  );
}
