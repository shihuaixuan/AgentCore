"use client";

import { useEffect, useState } from "react";
import { getV2ExportBlockCostEstimates } from "@/app/api/__generated__/endpoints/admin/admin";
import { okData } from "@/app/api/helpers";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { useToast } from "@/components/molecules/Toast/use-toast";
import type { BlockCostEstimatesResponse } from "@/app/api/__generated__/models/blockCostEstimatesResponse";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  dateInputToUtcIso,
  dateInputToUtcIsoEnd,
  defaultEndDate,
  defaultStartDate,
} from "../helpers";

export function useBlockCostEstimates() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [start, setStart] = useState(defaultStartDate);
  const [end, setEnd] = useState(defaultEndDate);
  const [minSamples, setMinSamples] = useState(10);
  const [data, setData] = useState<BlockCostEstimatesResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Re-baseline the default window every mount so a long-lived tab doesn't
  // freeze the dates at the original mount time.
  useEffect(() => {
    setStart(defaultStartDate());
    setEnd(defaultEndDate());
  }, []);

  async function fetchEstimates() {
    if (!start || !end) {
      toast({
        title: t("Pick a date range", "请选择日期范围"),
        description: t(
          "Both start and end dates are required.",
          "开始和结束日期均为必填项。",
        ),
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const startIso = dateInputToUtcIso(start);
      const endIso = dateInputToUtcIsoEnd(end);
      if (!startIso || !endIso) {
        toast({
          title: t("Invalid date range", "日期范围无效"),
          description: t(
            "Could not parse the selected start/end as UTC.",
            "无法将所选开始和结束时间解析为 UTC。",
          ),
          variant: "destructive",
        });
        return;
      }
      const safeMinSamples = Math.max(1, Math.floor(Number(minSamples) || 1));
      const response = await getV2ExportBlockCostEstimates({
        start: startIso as unknown as Date,
        end: endIso as unknown as Date,
        min_samples: safeMinSamples,
      });
      const payload = okData(response);
      if (!payload) {
        toast({
          title: t("Aggregation failed", "汇总失败"),
          description: t(
            "Unexpected response shape from the export endpoint.",
            "导出接口返回了非预期的数据结构。",
          ),
          variant: "destructive",
        });
        return;
      }
      setData(payload);
      toast({
        title: t("Aggregation complete", "汇总完成"),
        description: t(
          `${payload.total_rows} dynamic-cost blocks aggregated.`,
          `已汇总 ${payload.total_rows} 个动态成本模块。`,
        ),
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const detail =
          (err.response as { detail?: string } | undefined)?.detail ??
          err.message;
        toast({
          title:
            err.status === 400
              ? t("Window too large", "时间范围过大")
              : t("Aggregation failed", "汇总失败"),
          description: detail,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("Aggregation failed", "汇总失败"),
          description:
            err instanceof Error ? err.message : t("Unknown error", "未知错误"),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    start,
    end,
    minSamples,
    data,
    loading,
    setStart,
    setEnd,
    setMinSamples,
    fetchEstimates,
  };
}
