"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { getV2ExportCopilotWeeklyUsageVsRateLimit } from "@/app/api/__generated__/endpoints/admin/admin";
import { okData } from "@/app/api/helpers";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import {
  buildCopilotUsageCsv,
  dateInputToUtcIso,
  dateInputToUtcIsoEnd,
  defaultEndDate,
  defaultStartDate,
  downloadCsv,
} from "../helpers";
import { ChartLineIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function ExportCopilotUsageButton() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(defaultStartDate);
  const [end, setEnd] = useState(defaultEndDate);
  const [exporting, setExporting] = useState(false);

  // Refresh the default window each time the dialog opens — the lazy useState
  // initializer only runs once on mount, so without this the dates would
  // freeze at component-mount time and drift on a long-lived page.
  useEffect(() => {
    if (open) {
      setStart(defaultStartDate());
      setEnd(defaultEndDate());
    }
  }, [open]);

  async function handleExport() {
    if (!start || !end) {
      toast({
        title: t("Pick a date range", "选择日期范围"),
        description: t(
          "Both start and end dates are required.",
          "开始日期和结束日期均为必填项。",
        ),
        variant: "destructive",
      });
      return;
    }
    setExporting(true);
    try {
      const startIso = dateInputToUtcIso(start);
      const endIso = dateInputToUtcIsoEnd(end);
      if (!startIso || !endIso) return;
      // Pass ISO strings as-is — orval calls .toString() on Date params, which
      // produces a localised string FastAPI rejects (422). Strings round-trip.
      const response = await getV2ExportCopilotWeeklyUsageVsRateLimit({
        start: startIso as unknown as Date,
        end: endIso as unknown as Date,
      });
      const data = okData(response);
      if (!data) {
        toast({
          title: t("Export failed", "导出失败"),
          description: t(
            "Unexpected response shape from the export endpoint.",
            "导出接口返回的数据格式异常。",
          ),
          variant: "destructive",
        });
        return;
      }
      const csv = buildCopilotUsageCsv(data.rows);
      downloadCsv(csv, `copilot_weekly_usage_${start}_${end}.csv`);
      toast({
        title: t("Export ready", "导出完成"),
        description: t(
          `${data.total_rows} (user, week) rows downloaded.`,
          `已下载 ${data.total_rows} 行（用户、周）数据。`,
        ),
      });
      setOpen(false);
    } catch (err) {
      // customMutator throws ApiError on non-2xx. Surface backend cap-exceed
      // detail (400) so the operator can narrow their range without a refresh.
      if (err instanceof ApiError) {
        const detail =
          (err.response as { detail?: string } | undefined)?.detail ??
          err.message;
        toast({
          title:
            err.status === 400
              ? t("Window too large", "时间范围过大")
              : t("Export failed", "导出失败"),
          description: detail,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("Export failed", "导出失败"),
          description:
            err instanceof Error ? err.message : t("Unknown error", "未知错误"),
          variant: "destructive",
        });
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog
      title={t("Export copilot weekly usage", "导出 Copilot 每周用量")}
      styling={{ maxWidth: "30rem" }}
      controlled={{ isOpen: open, set: setOpen }}
    >
      <Dialog.Trigger>
        <Button
          variant="secondary"
          size="small"
          leftIcon={<Icon icon={ChartLineIcon} />}
        >
          {t("Copilot Usage CSV", "Copilot 用量 CSV")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <p className="text-body text-foreground-tertiary">
            {t(
              "Aggregates copilot:* spend by user and ISO week and joins each row against the user's tier-derived weekly limit.",
              "按用户和 ISO 周汇总 copilot:* 消费，并将每行与用户订阅方案对应的每周限额关联。",
            )}
          </p>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="copilot-export-start" className="text-body">
                {t("Start date (UTC)", "开始日期（UTC）")}
              </label>
              <input
                id="copilot-export-start"
                type="date"
                className="rounded border px-3 py-1.5 text-body"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="copilot-export-end" className="text-body">
                {t("End date (UTC)", "结束日期（UTC）")}
              </label>
              <input
                id="copilot-export-end"
                type="date"
                className="rounded border px-3 py-1.5 text-body"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <p className="text-caption text-foreground-tertiary">
            {t(
              "Window is capped at 90 days and 100k rows.",
              "时间范围最多为 90 天，最多导出 10 万行。",
            )}
          </p>
        </div>
        <Dialog.Footer>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setOpen(false)}
            disabled={exporting}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={handleExport}
            loading={exporting}
          >
            {t("Download CSV", "下载 CSV")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
