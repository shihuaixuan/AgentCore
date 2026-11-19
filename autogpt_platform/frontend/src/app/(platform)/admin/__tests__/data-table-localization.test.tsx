import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { ProviderTable } from "../platform-costs/components/ProviderTable";
import { LogsTable } from "../platform-costs/components/LogsTable";
import { DreamUsageSummary } from "../memory/components/DreamUsageSummary/DreamUsageSummary";
import { UsageBar } from "../components/UsageBar";

describe.each([
  {
    locale: "zh-CN" as Locale,
    provider: "服务提供商",
    rate: "openai（tokens）的费率",
    unit: "$/1K 令牌",
    usage: "1.0K 令牌",
    page: "第 1 / 2 页（共 11 条）",
    input: "输入",
    unlimited: "不限额",
    spent: "$1.00 已消费",
  },
  {
    locale: "en" as Locale,
    provider: "Provider",
    rate: "Rate for openai (tokens)",
    unit: "$/1K tokens",
    usage: "1.0K tokens",
    page: "Page 1 of 2 (11 total)",
    input: "In",
    unlimited: "Unlimited",
    spent: "$1.00 spent",
  },
])(
  "$locale admin data tables",
  ({ locale, provider, rate, unit, usage, page, input, unlimited, spent }) => {
    it("localizes rate controls without changing provider, model or API override keys", () => {
      const onRateOverride = vi.fn();
      render(
        <LanguageProvider initialLocale={locale}>
          <ProviderTable
            data={[
              {
                provider: "openai",
                model: "gpt-4o",
                tracking_type: "tokens",
                total_cost_microdollars: 0,
                total_input_tokens: 800,
                total_output_tokens: 200,
                request_count: 1,
              },
            ]}
            rateOverrides={{}}
            onRateOverride={onRateOverride}
          />
        </LanguageProvider>,
      );
      expect(
        screen.getByRole("columnheader", { name: provider }),
      ).toBeDefined();
      expect(screen.getByText("openai")).toBeDefined();
      expect(screen.getByText("gpt-4o")).toBeDefined();
      expect(screen.getByText(usage)).toBeDefined();
      expect(screen.getByText(unit)).toBeDefined();
      fireEvent.change(screen.getByRole("spinbutton", { name: rate }), {
        target: { value: "0.12" },
      });
      expect(onRateOverride).toHaveBeenCalledWith("openai:tokens:gpt-4o", 0.12);
    });

    it("localizes log pagination while retaining raw audit values", () => {
      render(
        <LanguageProvider initialLocale={locale}>
          <LogsTable
            logs={[
              {
                id: "log-1",
                created_at: new Date("2026-01-01T00:00:00Z"),
                block_name: "Raw English Block",
                provider: "anthropic",
                model: "claude-sonnet-4",
                tracking_type: "tokens",
                execution_path: "openai_batch",
                source: "dream_pass",
              },
            ]}
            pagination={{
              current_page: 1,
              total_pages: 2,
              total_items: 11,
              page_size: 10,
            }}
            onPageChange={vi.fn()}
            onExport={vi.fn()}
            exporting={false}
          />
        </LanguageProvider>,
      );
      expect(screen.getByText(page)).toBeDefined();
      for (const raw of [
        "Raw English Block",
        "anthropic",
        "claude-sonnet-4",
        "dream_pass",
      ]) {
        expect(screen.getByText(raw)).toBeDefined();
      }
      expect(screen.getByTitle("openai_batch")).toBeDefined();
    });

    it("localizes memory usage headers without translating phase or model names", () => {
      render(
        <LanguageProvider initialLocale={locale}>
          <DreamUsageSummary
            usage={{
              phases: [
                {
                  phase: "consolidate",
                  model: "claude-sonnet-4",
                  input_tokens: 1,
                  output_tokens: 2,
                  cache_read_tokens: 0,
                  cache_creation_tokens: 0,
                  cost_usd: 0.01,
                },
              ],
              total_input_tokens: 1,
              total_output_tokens: 2,
              total_cache_read_tokens: 0,
              total_cache_creation_tokens: 0,
              total_cost_usd: 0.01,
            }}
          />
        </LanguageProvider>,
      );
      expect(screen.getByRole("columnheader", { name: input })).toBeDefined();
      expect(screen.getByText("consolidate")).toBeDefined();
      expect(screen.getByText("claude-sonnet-4")).toBeDefined();
    });

    it("localizes both limited and unlimited usage displays", () => {
      render(
        <LanguageProvider initialLocale={locale}>
          <UsageBar used={1_000_000} limit={2_000_000} />
          <UsageBar used={0} limit={0} />
        </LanguageProvider>,
      );
      expect(screen.getByText(unlimited)).toBeDefined();
      expect(screen.getByText(spent)).toBeDefined();
    });
  },
);
