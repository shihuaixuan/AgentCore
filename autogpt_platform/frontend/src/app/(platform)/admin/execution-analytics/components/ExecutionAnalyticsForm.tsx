"use client";

// Chart series colours stay hex: recharts writes them as SVG attributes,
// where CSS variables do not resolve (ds-colour-exempt.json).

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/atoms/Button/Button";
import { BaseInput } from "@/components/atoms/Input/BaseInput";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Label } from "@/components/atoms/Label/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/components/SelectPrimitives";
import { Textarea } from "@/components/atoms/Textarea/Textarea";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Collapsible } from "@/components/molecules/Collapsible/Collapsible";
import { useToast } from "@/components/molecules/Toast/use-toast";
import {
  usePostV2GenerateExecutionAnalytics,
  useGetV2GetExecutionAnalyticsConfiguration,
  useGetV2GetExecutionAccuracyTrendsAndAlerts,
} from "@/app/api/__generated__/endpoints/admin/admin";
import type { ExecutionAnalyticsRequest } from "@/app/api/__generated__/models/executionAnalyticsRequest";
import type { ExecutionAnalyticsResponse } from "@/app/api/__generated__/models/executionAnalyticsResponse";
import type { AccuracyTrendsResponse } from "@/app/api/__generated__/models/accuracyTrendsResponse";
import type { AccuracyLatestData } from "@/app/api/__generated__/models/accuracyLatestData";
import { toAccuracyChartData } from "./accuracyChartData";

// Use the generated type with minimal adjustment for form handling
interface FormData extends Omit<ExecutionAnalyticsRequest, "created_after"> {
  created_after?: string; // Keep as string for datetime-local input
  // All other fields use the generated types as-is
}
import { AnalyticsResultsTable } from "./AnalyticsResultsTable";
import { okData } from "@/app/api/helpers";

export function ExecutionAnalyticsForm() {
  const { t } = useTranslation();
  const [results, setResults] = useState<ExecutionAnalyticsResponse | null>(
    null,
  );
  const [trendsData, setTrendsData] = useState<AccuracyTrendsResponse | null>(
    null,
  );
  const { toast } = useToast();

  // State for accuracy trends query parameters
  const [accuracyParams, setAccuracyParams] = useState<{
    graph_id: string;
    user_id?: string;
    days_back: number;
    drop_threshold: number;
    include_historical?: boolean;
  } | null>(null);

  // Use the generated API client for accuracy trends (GET)
  const { data: accuracyApiResponse, error: accuracyError } =
    useGetV2GetExecutionAccuracyTrendsAndAlerts(
      accuracyParams || {
        graph_id: "",
        days_back: 30,
        drop_threshold: 10.0,
        include_historical: false,
      },
      {
        query: {
          enabled: !!accuracyParams?.graph_id,
        },
      },
    );

  // Update local state when data changes and handle success/error
  useEffect(() => {
    if (accuracyError) {
      console.error("Failed to fetch trends:", accuracyError);
      toast({
        title: t("Trends Error", "趋势错误"),
        description:
          (accuracyError as any)?.message ||
          t("Failed to fetch accuracy trends", "无法获取准确性趋势"),
        variant: "destructive",
      });
      return;
    }

    const data = accuracyApiResponse?.data;
    if (data && "latest_data" in data) {
      setTrendsData(data);

      // Check for alerts
      if (data.alert) {
        toast({
          title: t("🚨 Accuracy Alert Detected", "🚨 检测到准确性告警"),
          description: t(
            `${data.alert.drop_percent.toFixed(1)}% accuracy drop detected for this agent ${formData.graph_id}`,
            `工作流 ${formData.graph_id} 的准确性下降了 ${data.alert.drop_percent.toFixed(1)}%`,
          ),
          variant: "destructive",
        });
      }
    }
  }, [accuracyApiResponse, accuracyError, toast]);

  // Chart component for accuracy trends
  function AccuracyChart({ data }: { data: AccuracyLatestData[] }) {
    const chartData = toAccuracyChartData(data);

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}%`, ""]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Daily Score"
            name={t("Daily Score", "每日评分")}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="3-Day Avg"
            name={t("3-Day Avg", "3 日平均")}
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="7-Day Avg"
            name={t("7-Day Avg", "7 日平均")}
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="14-Day Avg"
            name={t("14-Day Avg", "14 日平均")}
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Function to fetch accuracy trends using generated API client
  const fetchAccuracyTrends = (graphId: string, userId?: string) => {
    if (!graphId.trim()) return;

    setAccuracyParams({
      graph_id: graphId.trim(),
      user_id: userId?.trim() || undefined,
      days_back: 30,
      drop_threshold: 10.0,
      include_historical: showAccuracyChart, // Include historical data when chart is enabled
    });
  };

  // Fetch configuration from API
  const {
    data: config,
    isLoading: configLoading,
    error: configError,
  } = useGetV2GetExecutionAnalyticsConfiguration({ query: { select: okData } });

  const generateAnalytics = usePostV2GenerateExecutionAnalytics({
    mutation: {
      onSuccess: (res) => {
        if (res.status !== 200) {
          throw new Error("Something went wrong!");
        }
        const result = res.data;
        setResults(result);

        toast({
          title: t("Analytics Generated", "分析已生成"),
          description: t(
            `Processed ${result.processed_executions} executions. ${result.successful_analytics} successful, ${result.failed_analytics} failed, ${result.skipped_executions} skipped.`,
            `已处理 ${result.processed_executions} 个执行。${result.successful_analytics} 个成功，${result.failed_analytics} 个失败，${result.skipped_executions} 个已跳过。`,
          ),
          variant: "default",
        });
      },
      onError: (error: any) => {
        console.error("Analytics generation error:", error);

        const errorMessage =
          error?.message ||
          error?.detail ||
          t("An unexpected error occurred", "发生意外错误");
        const isOpenAIError = errorMessage.includes(
          "OpenAI API key not configured",
        );

        toast({
          title: isOpenAIError
            ? t("Analytics Generation Skipped", "已跳过生成分析")
            : t("Analytics Generation Failed", "分析生成失败"),
          description: isOpenAIError
            ? t(
                "Analytics generation requires OpenAI configuration, but accuracy trends are still available above.",
                "生成分析需要配置 OpenAI，但上方仍可查看准确性趋势。",
              )
            : errorMessage,
          variant: isOpenAIError ? "default" : "destructive",
        });
      },
    },
  });

  const [formData, setFormData] = useState<FormData>({
    graph_id: "",
    model_name: "", // Will be set from config
    batch_size: 10, // Fixed internal value
    skip_existing: true, // Default to skip existing
    system_prompt: "", // Will use config default when empty
    user_prompt: "", // Will use config default when empty
  });

  // State for accuracy trends chart toggle
  const [showAccuracyChart, setShowAccuracyChart] = useState(true);

  // Update form defaults when config loads
  useEffect(() => {
    if (config && !formData.model_name) {
      setFormData((prev) => ({
        ...prev,
        model_name: config.recommended_model,
      }));
    }
  }, [config, formData.model_name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.graph_id.trim()) {
      toast({
        title: t("Validation Error", "验证错误"),
        description: t("Graph ID is required", "工作流 ID 为必填项"),
        variant: "destructive",
      });
      return;
    }

    setResults(null);

    // Fetch accuracy trends if chart is enabled
    if (showAccuracyChart) {
      fetchAccuracyTrends(formData.graph_id, formData.user_id || undefined);
    }

    // Prepare the request payload
    const payload: ExecutionAnalyticsRequest = {
      graph_id: formData.graph_id.trim(),
      model_name: formData.model_name,
      batch_size: formData.batch_size,
      skip_existing: formData.skip_existing,
    };

    if (formData.graph_version) {
      payload.graph_version = formData.graph_version;
    }

    if (formData.user_id?.trim()) {
      payload.user_id = formData.user_id.trim();
    }

    if (
      formData.created_after &&
      typeof formData.created_after === "string" &&
      formData.created_after.trim()
    ) {
      payload.created_after = new Date(formData.created_after.trim());
    }

    if (formData.system_prompt?.trim()) {
      payload.system_prompt = formData.system_prompt.trim();
    }

    if (formData.user_prompt?.trim()) {
      payload.user_prompt = formData.user_prompt.trim();
    }

    generateAnalytics.mutate({ data: payload });
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));
  };

  // Show loading state while config loads
  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-foreground-tertiary">
          {t("Loading configuration...", "正在加载配置...")}
        </div>
      </div>
    );
  }

  // Show error state if config fails to load
  if (configError || !config) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-error">
          {t("Failed to load configuration", "无法加载配置")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="graph_id">
              {t("Graph ID", "工作流 ID")} <span className="text-error">*</span>
            </Label>
            <BaseInput
              id="graph_id"
              value={formData.graph_id}
              onChange={(e) => handleInputChange("graph_id", e.target.value)}
              placeholder={t("Enter graph/agent ID", "输入工作流 ID")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="graph_version">
              {t("Graph Version", "工作流版本")}
            </Label>
            <BaseInput
              id="graph_version"
              type="number"
              value={formData.graph_version || ""}
              onChange={(e) =>
                handleInputChange(
                  "graph_version",
                  e.target.value ? parseInt(e.target.value) : undefined,
                )
              }
              placeholder={t(
                "Optional - leave empty for all versions",
                "可选，不填表示所有版本",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_id">{t("User ID", "用户 ID")}</Label>
            <BaseInput
              id="user_id"
              value={formData.user_id || ""}
              onChange={(e) => handleInputChange("user_id", e.target.value)}
              placeholder={t(
                "Optional - leave empty for all users",
                "可选，不填表示所有用户",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="created_after">
              {t("Created After", "创建时间晚于")}
            </Label>
            <BaseInput
              id="created_after"
              type="datetime-local"
              value={formData.created_after || ""}
              onChange={(e) =>
                handleInputChange("created_after", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model_name">{t("AI Model", "AI 模型")}</Label>
            <Select
              value={formData.model_name}
              onValueChange={(value) => handleInputChange("model_name", value)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("Select AI model", "选择 AI 模型")}
                />
              </SelectTrigger>
              <SelectContent>
                {config.available_models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* {t("Advanced Options", "高级选项")} Section - Collapsible */}
        <div className="border-t pt-6">
          <Collapsible
            trigger={
              <Text variant="lead-semibold" as="h3" tone="body">
                {t("Advanced Options", "高级选项")}
              </Text>
            }
            defaultOpen={false}
            contentClassName="mt-4"
          >
            <div className="space-y-4 pt-4">
              {/* Skip Existing Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip_existing"
                  checked={formData.skip_existing}
                  onCheckedChange={(checked) =>
                    handleInputChange("skip_existing", checked)
                  }
                />
                <Label htmlFor="skip_existing">
                  <Text variant="body-medium-tight" as="span" tone="inherit">
                    {t(
                      "Skip executions that already have activity status and correctness score",
                      "跳过已有活动状态和正确性评分的执行",
                    )}
                  </Text>
                </Label>
              </div>

              {/* Show Accuracy Chart Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_accuracy_chart"
                  checked={showAccuracyChart}
                  onCheckedChange={(checked) => setShowAccuracyChart(!!checked)}
                />
                <Label htmlFor="show_accuracy_chart">
                  <Text variant="body-medium-tight" as="span" tone="inherit">
                    {t(
                      "Show accuracy trends chart and historical data visualization",
                      "显示准确性趋势图和历史数据可视化",
                    )}
                  </Text>
                </Label>
              </div>

              {/* Custom System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="system_prompt">
                  {t(
                    "Custom System Prompt (Optional)",
                    "自定义系统提示词（可选）",
                  )}
                </Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt || ""}
                  onChange={(e) =>
                    handleInputChange("system_prompt", e.target.value)
                  }
                  placeholder={config.default_system_prompt}
                  rows={6}
                  className="resize-y"
                />
                <Text variant="body-tight" tone="secondary">
                  {t(
                    "Customize how the AI evaluates execution success and failure. Leave empty to use the default prompt shown above.",
                    "自定义 AI 评估执行成功或失败的方式。留空则使用上方的默认提示词。",
                  )}
                </Text>
              </div>

              {/* Custom User Prompt */}
              <div className="space-y-2">
                <Label htmlFor="user_prompt">
                  {t(
                    "Custom User Prompt Template (Optional)",
                    "自定义用户提示词模板（可选）",
                  )}
                </Label>
                <Textarea
                  id="user_prompt"
                  value={formData.user_prompt || ""}
                  onChange={(e) =>
                    handleInputChange("user_prompt", e.target.value)
                  }
                  placeholder={config.default_user_prompt}
                  rows={8}
                  className="resize-y"
                />
                <Text variant="body-tight" tone="secondary">
                  {t(
                    "Customize the analysis instructions. Use",
                    "自定义分析指令。使用",
                  )}{" "}
                  <code className="rounded bg-surface-hover px-1">
                    {"{{GRAPH_NAME}}"}
                  </code>{" "}
                  {t("and", "和")}{" "}
                  <code className="rounded bg-surface-hover px-1">
                    {"{{EXECUTION_DATA}}"}
                  </code>{" "}
                  {t(
                    "as placeholders. Leave empty to use the default template shown above.",
                    "作为占位符。留空则使用上方的默认模板。",
                  )}
                </Text>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    handleInputChange(
                      "system_prompt",
                      config.default_system_prompt,
                    );
                  }}
                >
                  {t("Reset System Prompt", "重置系统提示词")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    handleInputChange(
                      "user_prompt",
                      config.default_user_prompt,
                    );
                  }}
                >
                  {t("Reset User Prompt", "重置用户提示词")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    handleInputChange("system_prompt", "");
                    handleInputChange("user_prompt", "");
                  }}
                >
                  {t("Clear All Prompts", "清空所有提示词")}
                </Button>
              </div>
            </div>
          </Collapsible>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={generateAnalytics.isPending}
          >
            {generateAnalytics.isPending
              ? t("Processing...", "处理中...")
              : t("Generate Analytics", "生成分析")}
          </Button>
        </div>
      </form>

      {/* Accuracy Trends Display */}
      {trendsData && (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <Text variant="lead-semibold" as="h3" tone="inherit">
              {t("Execution Accuracy Trends", "执行准确性趋势")}
            </Text>
            <div className="rounded-md bg-info-surface px-3 py-2 text-caption leading-4 text-info-foreground">
              <p className="font-medium">
                {t(
                  "Chart Filters (matches monitoring system):",
                  "图表筛选条件（与监控系统一致）：",
                )}
              </p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>
                  {t(
                    "Only days with ≥1 execution with correctness score",
                    "仅统计至少有 1 次执行且有正确性评分的日期",
                  )}
                </li>
                <li>{t("Last 30 days", "最近 30 天")}</li>
                <li>
                  {t(
                    "Averages calculated from scored executions only",
                    "平均值仅根据有评分的执行计算",
                  )}
                </li>
              </ul>
            </div>
          </div>

          {/* Alert Section */}
          {trendsData.alert && (
            <div className="rounded-lg border-l-4 border-error bg-error-surface p-4">
              <div className="flex items-start">
                <Text variant="heading-md" as="span" tone="inherit">
                  🚨
                </Text>
                <div className="ml-3 space-y-2">
                  <h4 className="text-lead font-semibold text-error-foreground">
                    {t("Accuracy Alert Detected", "检测到准确性告警")}
                  </h4>
                  <p className="text-error-foreground">
                    <strong>
                      {t(
                        `${trendsData.alert.drop_percent.toFixed(1)}% accuracy drop`,
                        `准确性下降 ${trendsData.alert.drop_percent.toFixed(1)}%`,
                      )}
                    </strong>{" "}
                    {t("detected for agent", "对应工作流")}{" "}
                    <code className="rounded bg-error-surface px-1 font-mono text-body leading-5">
                      {formData.graph_id}
                    </code>
                  </p>
                  <div className="space-y-1 text-body leading-5 text-error-foreground">
                    <p>
                      {t("• 3-day average:", "• 3 日平均：")}{" "}
                      <strong>
                        {trendsData.alert.three_day_avg.toFixed(2)}%
                      </strong>
                    </p>
                    <p>
                      {t("• 7-day average:", "• 7 日平均：")}{" "}
                      <strong>
                        {trendsData.alert.seven_day_avg.toFixed(2)}%
                      </strong>
                    </p>
                    <p>
                      {t("• Detected at:", "• 检测时间：")}{" "}
                      <strong>
                        {new Date(
                          trendsData.alert.detected_at,
                        ).toLocaleString()}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Latest Data Summary */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-surface p-4 text-center text-info-foreground">
              <Text variant="heading-md-bold" as="div" tone="inherit">
                {trendsData.latest_data.daily_score?.toFixed(2) ||
                  t("N/A", "不适用")}
              </Text>
              <Text variant="body-tight" as="div" tone="secondary">
                {t("Daily Score", "每日评分")}
              </Text>
            </div>
            <div className="rounded-lg border bg-surface p-4 text-center">
              <Text variant="heading-md-bold" as="div" tone="success">
                {trendsData.latest_data.three_day_avg?.toFixed(2) ||
                  t("N/A", "不适用")}
              </Text>
              <Text variant="body-tight" as="div" tone="secondary">
                {t("3-Day Avg", "3 日平均")}
              </Text>
            </div>
            <div className="rounded-lg border bg-surface p-4 text-center text-orange-foreground">
              <Text variant="heading-md-bold" as="div" tone="inherit">
                {trendsData.latest_data.seven_day_avg?.toFixed(2) ||
                  t("N/A", "不适用")}
              </Text>
              <Text variant="body-tight" as="div" tone="secondary">
                {t("7-Day Avg", "7 日平均")}
              </Text>
            </div>
            <div className="rounded-lg border bg-surface p-4 text-center text-brand-hover">
              <Text variant="heading-md-bold" as="div" tone="inherit">
                {trendsData.latest_data.fourteen_day_avg?.toFixed(2) ||
                  t("N/A", "不适用")}
              </Text>
              <Text variant="body-tight" as="div" tone="secondary">
                {t("14-Day Avg", "14 日平均")}
              </Text>
            </div>
          </div>

          {/* Chart Section - only show when toggle is enabled and historical data exists */}
          {showAccuracyChart && trendsData?.historical_data && (
            <div className="mt-6">
              <Text
                variant="lead-semibold"
                as="h4"
                tone="inherit"
                className="mb-4"
              >
                {t("Execution Accuracy Trends Chart", "执行准确性趋势图")}
              </Text>
              <div className="rounded-lg border bg-surface p-6">
                <AccuracyChart data={trendsData.historical_data} />
              </div>
            </div>
          )}
        </div>
      )}

      {results && <AnalyticsResultsTable results={results} />}
    </div>
  );
}
