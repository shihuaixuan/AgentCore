"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/components/SelectPrimitives";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { getV2ExportCreditTransactions } from "@/app/api/__generated__/endpoints/admin/admin";
import { okData } from "@/app/api/helpers";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { CreditTransactionType } from "@/app/api/__generated__/models/creditTransactionType";
import {
  buildCreditTransactionsCsv,
  dateInputToUtcIso,
  dateInputToUtcIsoEnd,
  defaultEndDate,
  defaultStartDate,
  downloadCsv,
} from "../helpers";
import { Download04Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type TypeFilter = "ALL" | CreditTransactionType;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "All types" },
  { value: CreditTransactionType.TOP_UP, label: "Top up" },
  { value: CreditTransactionType.USAGE, label: "Usage" },
  { value: CreditTransactionType.GRANT, label: "Grant" },
  { value: CreditTransactionType.REFUND, label: "Refund" },
  { value: CreditTransactionType.CARD_CHECK, label: "Card check" },
  { value: CreditTransactionType.SUBSCRIPTION, label: "Subscription" },
];

export function ExportCreditTransactionsButton() {
  const { t } = useTranslation();
  const typeLabels: Record<TypeFilter, string> = {
    ALL: "全部类型",
    TOP_UP: "充值",
    USAGE: "使用",
    GRANT: "赠送",
    REFUND: "退款",
    CARD_CHECK: "银行卡验证",
    SUBSCRIPTION: "订阅",
  };
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(defaultStartDate);
  const [end, setEnd] = useState(defaultEndDate);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [userId, setUserId] = useState("");
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
      const response = await getV2ExportCreditTransactions({
        start: startIso as unknown as Date,
        end: endIso as unknown as Date,
        transaction_type:
          typeFilter === "ALL"
            ? undefined
            : (typeFilter as CreditTransactionType),
        user_id: userId.trim() || undefined,
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
      const csv = buildCreditTransactionsCsv(data.transactions);
      downloadCsv(csv, `credit_transactions_${start}_${end}.csv`);
      toast({
        title: t("Export ready", "导出完成"),
        description: t(
          `${data.total_rows} transactions downloaded.`,
          `已下载 ${data.total_rows} 笔交易。`,
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
      title={t("Export credit transactions", "导出积分交易")}
      styling={{ maxWidth: "30rem" }}
      controlled={{ isOpen: open, set: setOpen }}
    >
      <Dialog.Trigger>
        <Button
          variant="secondary"
          size="small"
          leftIcon={<Icon icon={Download04Icon} />}
        >
          {t("Export CSV", "导出 CSV")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="credit-export-start" className="text-body">
                {t("Start date (UTC)", "开始日期（UTC）")}
              </label>
              <input
                id="credit-export-start"
                type="date"
                className="rounded border px-3 py-1.5 text-body"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="credit-export-end" className="text-body">
                {t("End date (UTC)", "结束日期（UTC）")}
              </label>
              <input
                id="credit-export-end"
                type="date"
                className="rounded border px-3 py-1.5 text-body"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-body" htmlFor="credit-export-type">
              {t("Transaction type", "交易类型")}
            </label>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger id="credit-export-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.label, typeLabels[opt.value])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-body" htmlFor="credit-export-user-id">
              {t("User ID (optional)", "用户 ID（可选）")}
            </label>
            <input
              id="credit-export-user-id"
              type="text"
              placeholder={t(
                "Filter by a single user ID",
                "按单个用户 ID 筛选",
              )}
              className="rounded border px-3 py-1.5 text-body"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <p className="text-caption text-foreground-tertiary">
            {t(
              "Window is capped at 90 days and 100k rows. Narrow the range if the backend returns a 400.",
              "时间范围最多为 90 天，最多导出 10 万行。如果后端返回 400，请缩小范围。",
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
