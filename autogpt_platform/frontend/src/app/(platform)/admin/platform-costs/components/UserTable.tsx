import type { PlatformCostDashboard } from "@/app/api/__generated__/models/platformCostDashboard";
import { formatMicrodollars, formatTokens } from "../helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  data: PlatformCostDashboard["by_user"];
}

function UserTable({ data }: Props) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-body">
        <thead className="border-b text-caption text-foreground-tertiary uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">
              {t("User", "用户")}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              {t("Known Cost", "已知成本")}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              {t("Requests", "请求数")}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              {t("Input Tokens", "输入令牌")}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              {t("Output Tokens", "输出令牌")}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              {t("Avg Cost / Req", "平均请求成本")}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.user_id ?? `unknown-${idx}`}
              className="border-b hover:bg-surface-hover"
            >
              <td className="px-4 py-3">
                <div className="font-medium">{row.email || t("Unknown", "未知")}</div>
                <div className="text-caption text-foreground-tertiary">
                  {row.user_id}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                {row.total_cost_microdollars > 0
                  ? formatMicrodollars(row.total_cost_microdollars)
                  : "-"}
              </td>
              <td className="px-4 py-3 text-right">
                {row.request_count.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                {formatTokens(row.total_input_tokens)}
              </td>
              <td className="px-4 py-3 text-right">
                {formatTokens(row.total_output_tokens)}
              </td>
              <td className="px-4 py-3 text-right">
                {(row.cost_bearing_request_count ?? 0) > 0 &&
                row.total_cost_microdollars > 0
                  ? formatMicrodollars(
                      row.total_cost_microdollars /
                        (row.cost_bearing_request_count ?? 1),
                    )
                  : "-"}
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={6}
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

export { UserTable };
