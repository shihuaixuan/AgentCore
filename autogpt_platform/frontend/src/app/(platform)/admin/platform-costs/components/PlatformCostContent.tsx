"use client";

import { Alert, AlertDescription } from "@/components/molecules/Alert/Alert";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { formatMicrodollars, formatTokens } from "../helpers";
import { SummaryCard } from "./SummaryCard";
import { ProviderTable } from "./ProviderTable";
import { UserTable } from "./UserTable";
import { LogsTable } from "./LogsTable";
import { usePlatformCostContent } from "./usePlatformCostContent";
import type { CostBucket } from "@/app/api/__generated__/models/costBucket";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  searchParams: {
    start?: string;
    end?: string;
    provider?: string;
    user_id?: string;
    model?: string;
    block_name?: string;
    tracking_type?: string;
    graph_exec_id?: string;
    page?: string;
    tab?: string;
  };
}

export function PlatformCostContent({ searchParams }: Props) {
  const { t } = useTranslation();
  const {
    dashboard,
    logs,
    pagination,
    loading,
    error,
    totalEstimatedCost,
    tab,
    startInput,
    setStartInput,
    endInput,
    setEndInput,
    providerInput,
    setProviderInput,
    userInput,
    setUserInput,
    modelInput,
    setModelInput,
    blockInput,
    setBlockInput,
    typeInput,
    setTypeInput,
    executionIDInput,
    setExecutionIDInput,
    executionPathInput,
    setExecutionPathInput,
    sourceInput,
    setSourceInput,
    rateOverrides,
    handleRateOverride,
    updateUrl,
    handleFilter,
    exporting,
    handleExport,
  } = usePlatformCostContent(searchParams);

  const summaryCards: { label: string; value: string; subtitle?: string }[] =
    dashboard
      ? [
          {
            label: t("Known Cost", "已知成本"),
            value: formatMicrodollars(dashboard.total_cost_microdollars),
            subtitle: t(
              "From providers that report USD cost",
              "来自报告美元成本的服务提供商",
            ),
          },
          {
            label: t("Estimated Total", "估算总额"),
            value: formatMicrodollars(totalEstimatedCost),
            subtitle: t(
              "Including per-run cost estimates",
              "包括每次运行的成本估算",
            ),
          },
          {
            label: t("Total Requests", "请求总数"),
            value: dashboard.total_requests.toLocaleString(),
          },
          {
            label: t("Active Users", "活跃用户"),
            value: dashboard.total_users.toLocaleString(),
          },
          {
            label: t("Avg Cost / Request", "平均请求成本"),
            value: formatMicrodollars(
              dashboard.avg_cost_microdollars_per_request ?? 0,
            ),
            subtitle: t(
              "Known cost divided by cost-bearing requests",
              "已知成本除以产生成本的请求数",
            ),
          },
          {
            label: t("Avg Input Tokens", "平均输入令牌"),
            value: Math.round(
              dashboard.avg_input_tokens_per_request ?? 0,
            ).toLocaleString(),
            subtitle: t(
              "Prompt tokens per request (context size)",
              "每次请求的提示令牌（上下文大小）",
            ),
          },
          {
            label: t("Avg Output Tokens", "平均输出令牌"),
            value: Math.round(
              dashboard.avg_output_tokens_per_request ?? 0,
            ).toLocaleString(),
            subtitle: t(
              "Completion tokens per request (response length)",
              "每次请求的完成令牌（响应长度）",
            ),
          },
          {
            label: t("Total Tokens", "令牌总数"),
            value: t(
              `${formatTokens(dashboard.total_input_tokens ?? 0)} in / ${formatTokens(dashboard.total_output_tokens ?? 0)} out`,
              `输入 ${formatTokens(dashboard.total_input_tokens ?? 0)} / 输出 ${formatTokens(dashboard.total_output_tokens ?? 0)}`,
            ),
            subtitle: t(
              "Prompt vs completion token split",
              "提示令牌与完成令牌的拆分",
            ),
          },
          {
            label: t("Typical Cost (P50)", "典型成本（P50）"),
            value: formatMicrodollars(dashboard.cost_p50_microdollars ?? 0),
            subtitle: t("Median cost per request", "每次请求的中位成本"),
          },
          {
            label: t("Upper Cost (P75)", "较高成本（P75）"),
            value: formatMicrodollars(dashboard.cost_p75_microdollars ?? 0),
            subtitle: t("75th percentile cost", "第 75 百分位成本"),
          },
          {
            label: t("High Cost (P95)", "高成本（P95）"),
            value: formatMicrodollars(dashboard.cost_p95_microdollars ?? 0),
            subtitle: t("95th percentile cost", "第 95 百分位成本"),
          },
          {
            label: t("Peak Cost (P99)", "峰值成本（P99）"),
            value: formatMicrodollars(dashboard.cost_p99_microdollars ?? 0),
            subtitle: t("99th percentile cost", "第 99 百分位成本"),
          },
        ]
      : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="start-date"
            className="text-body text-foreground-tertiary"
          >
            {t("Start Date", "开始日期")}{" "}
            <span className="text-caption">
              {t(
                "(local time — defaults to last 30 days)",
                "（本地时间 — 默认为最近 30 天）",
              )}
            </span>
          </label>
          <input
            id="start-date"
            type="datetime-local"
            className="rounded border px-3 py-1.5 text-body"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="end-date"
            className="text-body text-foreground-tertiary"
          >
            {t("End Date", "结束日期")}{" "}
            <span className="text-caption">
              {t("(local time)", "（本地时间）")}
            </span>
          </label>
          <input
            id="end-date"
            type="datetime-local"
            className="rounded border px-3 py-1.5 text-body"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="provider-filter"
            className="text-body text-foreground-tertiary"
          >
            {t("Provider", "服务提供商")}
          </label>
          <input
            id="provider-filter"
            type="text"
            placeholder={t("e.g. openai", "例如 openai")}
            className="rounded border px-3 py-1.5 text-body"
            value={providerInput}
            onChange={(e) => setProviderInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="user-id-filter"
            className="text-body text-foreground-tertiary"
          >
            {t("User ID", "用户 ID")}
          </label>
          <input
            id="user-id-filter"
            type="text"
            placeholder={t("Filter by user", "按用户筛选")}
            className="rounded border px-3 py-1.5 text-body"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="model-filter"
            className="text-body text-foreground-tertiary"
          >
            {t("Model", "模型")}
          </label>
          <input
            id="model-filter"
            type="text"
            placeholder={t("e.g. gpt-4o", "例如 gpt-4o")}
            className="rounded border px-3 py-1.5 text-body"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="block-filter"
            className="text-body text-foreground-tertiary"
          >
            {t("Block", "模块")}
          </label>
          <input
            id="block-filter"
            type="text"
            placeholder={t("e.g. LLMBlock", "例如 LLMBlock")}
            className="rounded border px-3 py-1.5 text-body"
            value={blockInput}
            onChange={(e) => setBlockInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="type-filter"
            className="text-body text-foreground-tertiary"
          >
            {t("Type", "类型")}
          </label>
          <input
            id="type-filter"
            type="text"
            placeholder={t("e.g. tokens", "例如 tokens")}
            className="rounded border px-3 py-1.5 text-body"
            value={typeInput}
            onChange={(e) => setTypeInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="execution-id-filter"
            className="text-body text-foreground-tertiary"
          >
            {t("Execution ID", "执行 ID")}
          </label>
          <input
            id="execution-id-filter"
            type="text"
            placeholder={t("Filter by execution", "按执行记录筛选")}
            className="rounded border px-3 py-1.5 text-body"
            value={executionIDInput}
            onChange={(e) => setExecutionIDInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="execution-path-filter"
            className="text-body text-foreground-tertiary"
          >
            {t("Path", "路径")}
          </label>
          <select
            id="execution-path-filter"
            className="rounded border px-3 py-1.5 text-body"
            value={executionPathInput}
            onChange={(e) => setExecutionPathInput(e.target.value)}
          >
            <option value="">{t("All", "全部")}</option>
            <option value="sync">sync</option>
            <option value="anthropic_batch">anthropic_batch</option>
            <option value="openai_batch">openai_batch</option>
            <option value="flex">flex</option>
            <option value="sync_baseline">
              {t("sync_baseline (dream)", "sync_baseline（记忆整理）")}
            </option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="source-filter"
            className="text-body text-foreground-tertiary"
          >
            {t("Source", "来源")}
          </label>
          <select
            id="source-filter"
            className="rounded border px-3 py-1.5 text-body"
            value={sourceInput}
            onChange={(e) => setSourceInput(e.target.value)}
          >
            <option value="">{t("All", "全部")}</option>
            <option value="copilot">copilot</option>
            <option value="dream_pass">dream_pass</option>
          </select>
        </div>
        <button
          onClick={handleFilter}
          className="rounded bg-action px-4 py-1.5 text-body text-action-foreground hover:bg-action/90"
        >
          {t("Apply", "应用")}
        </button>
        <button
          onClick={() => {
            setStartInput("");
            setEndInput("");
            setProviderInput("");
            setUserInput("");
            setModelInput("");
            setBlockInput("");
            setTypeInput("");
            setExecutionIDInput("");
            setExecutionPathInput("");
            setSourceInput("");
            updateUrl({
              start: "",
              end: "",
              provider: "",
              user_id: "",
              model: "",
              block_name: "",
              tracking_type: "",
              graph_exec_id: "",
              execution_path: "",
              source: "",
              page: "1",
            });
          }}
          className="rounded border px-4 py-1.5 text-body hover:bg-surface-hover"
        >
          {t("Clear", "清除")}
        </button>
      </div>

      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {/* 12 skeleton placeholders — one per summary card */}
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <>
          {dashboard && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {summaryCards.map((card) => (
                  <SummaryCard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    subtitle={card.subtitle}
                  />
                ))}
              </div>

              {dashboard.cost_buckets && dashboard.cost_buckets.length > 0 && (
                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 text-body font-medium">
                    {t("Cost Distribution by Bucket", "按区间划分的成本分布")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
                    {dashboard.cost_buckets.map((b: CostBucket) => (
                      <div
                        key={b.bucket}
                        className="flex flex-col items-center rounded border p-2 text-center"
                      >
                        <span className="text-caption text-foreground-tertiary">
                          {b.bucket}
                        </span>
                        <span className="text-lead font-semibold">
                          {b.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div
            role="tablist"
            aria-label={t("Cost view tabs", "成本视图选项卡")}
            className="flex gap-2 border-b"
          >
            {["overview", "by-user", "logs"].map((tabKey) => (
              <button
                key={tabKey}
                id={`tab-${tabKey}`}
                role="tab"
                aria-selected={tab === tabKey}
                aria-controls={`tabpanel-${tabKey}`}
                onClick={() => updateUrl({ tab: tabKey, page: "1" })}
                className={`px-4 py-2 text-body font-medium ${tab === tabKey ? "border-b-2 border-action text-action" : "text-foreground-tertiary hover:text-foreground-base"}`}
              >
                {tabKey === "overview"
                  ? t("By Provider", "按服务提供商")
                  : tabKey === "by-user"
                    ? t("By User", "按用户")
                    : t("Raw Logs", "原始日志")}
              </button>
            ))}
          </div>

          {tab === "overview" && dashboard && (
            <div
              role="tabpanel"
              id="tabpanel-overview"
              aria-labelledby="tab-overview"
            >
              <ProviderTable
                data={dashboard.by_provider}
                rateOverrides={rateOverrides}
                onRateOverride={handleRateOverride}
              />
            </div>
          )}
          {tab === "by-user" && dashboard && (
            <div
              role="tabpanel"
              id="tabpanel-by-user"
              aria-labelledby="tab-by-user"
            >
              <UserTable data={dashboard.by_user} />
            </div>
          )}
          {tab === "logs" && (
            <div role="tabpanel" id="tabpanel-logs" aria-labelledby="tab-logs">
              <LogsTable
                logs={logs}
                pagination={pagination}
                onPageChange={(p) => updateUrl({ page: p.toString() })}
                onExport={handleExport}
                exporting={exporting}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
