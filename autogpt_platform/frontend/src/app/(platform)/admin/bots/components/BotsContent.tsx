"use client";

import { Card } from "@/components/atoms/Card/Card";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { Select } from "@/components/atoms/Select/Select";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";

import { MessageVolumeChart } from "./MessageVolumeChart";
import { PlatformBadge } from "./PlatformBadge";
import { ServerGrowthChart } from "./ServerGrowthChart";
import { SimpleTable } from "./SimpleTable";
import { SummaryCard } from "./SummaryCard";
import { useBotsContent } from "./useBotsContent";
import {
  DAYS_OPTIONS,
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
  PLATFORM_OPTIONS,
} from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function BotsContent() {
  const { t, locale } = useTranslation();
  const state = useBotsContent();
  const { summary } = state;

  // On "All platforms" the rows mix Discord and Slack, so lead each table with a
  // platform badge. When a single platform is selected the column is redundant.
  const showPlatform = state.platform === "all";

  const tiles = [
    {
      label: t("Live servers", "在线服务器"),
      value: formatNumber(summary?.live_servers),
    },
    {
      label: t("Messages received", "收到的消息"),
      value: formatNumber(summary?.messages_received),
    },
    {
      label: t("Replies sent", "发送的回复"),
      value: formatNumber(summary?.replies_sent),
    },
    {
      label: t("Commands used", "使用的命令"),
      value: formatNumber(summary?.commands_used),
    },
    {
      label: t("Error rate", "错误率"),
      value: formatPercent(summary?.error_rate),
      subtitle: `${formatNumber(summary?.stream_errors)} ${t("stream errors", "流错误")}`,
    },
    {
      label: t("Avg reply time", "平均回复时间"),
      value: formatDuration(summary?.avg_reply_ms),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <Select
          id="platform-filter"
          label={t("Platform", "平台")}
          hideLabel
          value={state.platform}
          onValueChange={state.setPlatform}
          options={PLATFORM_OPTIONS.map((option) => ({
            ...option,
            label:
              option.value === "all"
                ? t(option.label, "全部平台")
                : option.label,
          }))}
          size="small"
        />
        <Select
          id="days-filter"
          label={t("Range", "时间范围")}
          hideLabel
          value={String(state.days)}
          onValueChange={(value) => state.setDays(Number(value))}
          options={DAYS_OPTIONS.map((option) => ({
            ...option,
            label: t(option.label, `最近 ${option.value} 天`),
          }))}
          size="small"
        />
      </div>

      {state.isError ? (
        <ErrorCard
          httpError={{
            message:
              state.error instanceof Error
                ? state.error.message
                : t("Failed to load bot analytics", "无法加载机器人分析数据"),
          }}
          context={t("bot analytics", "机器人分析")}
          hint={t(
            "Make sure the backend is running the latest build and try again.",
            "请确认后端运行的是最新版本，然后重试。",
          )}
        />
      ) : state.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {tiles.map((tile) => (
              <SummaryCard key={tile.label} {...tile} />
            ))}
          </div>

          <Card>
            <h2 className="mb-4 text-lead font-semibold">
              {t("Server growth & sharding outlook", "服务器增长与分片规划")}
            </h2>
            <ServerGrowthChart data={state.servers} />
          </Card>

          <Card>
            <h2 className="mb-4 text-lead font-semibold">
              {t("Message volume", "消息量")}
            </h2>
            <MessageVolumeChart data={state.messages} />
          </Card>

          <Card>
            <h2 className="mb-4 text-lead font-semibold">
              {t("Top servers by activity", "活跃度最高的服务器")}
            </h2>
            <SimpleTable
              columns={[
                ...(showPlatform ? [t("Platform", "平台")] : []),
                t("Server", "服务器"),
                t("Messages", "消息"),
                t("Commands", "命令"),
              ]}
              rows={state.topServers.map((server) => [
                ...(showPlatform
                  ? [<PlatformBadge key="p" platform={server.platform} />]
                  : []),
                server.name || server.server_id,
                formatNumber(server.messages),
                formatNumber(server.commands),
              ])}
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-lead font-semibold">
                {t("Command usage", "命令使用情况")}
              </h2>
              <SimpleTable
                columns={[
                  ...(showPlatform ? [t("Platform", "平台")] : []),
                  t("Command", "命令"),
                  t("Uses", "使用次数"),
                ]}
                rows={state.commands.map((command) => [
                  ...(showPlatform
                    ? [<PlatformBadge key="p" platform={command.platform} />]
                    : []),
                  `/${command.command}`,
                  formatNumber(command.uses),
                ])}
              />
            </Card>

            <Card>
              <h2 className="mb-4 text-lead font-semibold">
                {t("Server roster", "服务器列表")}
              </h2>
              <SimpleTable
                columns={[
                  ...(showPlatform ? [t("Platform", "平台")] : []),
                  t("Server", "服务器"),
                  t("Status", "状态"),
                  t("Joined", "加入时间"),
                ]}
                rows={state.roster.map((guild) => [
                  ...(showPlatform
                    ? [<PlatformBadge key="p" platform={guild.platform} />]
                    : []),
                  guild.name || guild.server_id,
                  guild.active ? t("Active", "活跃") : t("Left", "已离开"),
                  formatDate(guild.joined_at, locale),
                ])}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
