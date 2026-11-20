import { postV2DiscoverManagedChatModels } from "@/app/api/__generated__/endpoints/chat/chat";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useState } from "react";

type Discovery =
  | { status: "idle" | "loading" }
  | { status: "success"; ids: string[] }
  | { status: "error"; code: number };

export function useModelDiscovery() {
  const { t } = useTranslation();
  const [result, setResult] = useState<Discovery>({ status: "idle" });

  async function fetchModels(baseURL: string, apiKey: string) {
    setResult({ status: "loading" });
    try {
      const response = await postV2DiscoverManagedChatModels({
        base_url: baseURL,
        api_key: apiKey,
      });
      if (response.status !== 200) {
        setResult({ status: "error", code: response.status });
        return;
      }
      setResult({ status: "success", ids: response.data });
    } catch (error) {
      setResult({
        status: "error",
        code: error instanceof ApiError ? error.status : 0,
      });
    }
  }

  const ids = result.status === "success" ? result.ids : [];
  const message =
    result.status === "error"
      ? discoveryMessage(result.code, t)
      : result.status === "success"
        ? ids.length
          ? t(
              `${ids.length} models found. Choose one below.`,
              `已找到 ${ids.length} 个模型，请在下方选择。`,
            )
          : t(
              "The provider returned no models. You can enter an ID manually.",
              "网关没有返回模型，可以手动输入模型 ID。",
            )
        : "";

  return {
    ids,
    message,
    loading: result.status === "loading",
    failed: result.status === "error",
    fetchModels,
    clear: () => setResult({ status: "idle" }),
  };
}

function discoveryMessage(code: number, t: (en: string, zh: string) => string) {
  switch (code) {
    case 422:
      return t(
        "Check the public HTTP or HTTPS Base URL and API key.",
        "请检查公网 HTTP 或 HTTPS Base URL 和 API Key。",
      );
    case 424:
      return t(
        "The provider rejected the key for model listing.",
        "网关拒绝了模型列表请求，请检查 API Key 和权限。",
      );
    case 404:
      return t(
        "No model list at this Base URL. Check the URL or enter an ID manually.",
        "该 Base URL 没有提供模型列表，请检查地址或手动输入模型 ID。",
      );
    case 504:
      return t(
        "The provider did not respond in time. Try again or enter an ID manually.",
        "网关响应超时，可以重试或手动输入模型 ID。",
      );
    default:
      return t(
        "Could not fetch models. Check the connection or enter an ID manually.",
        "无法获取模型，请检查连接或手动输入模型 ID。",
      );
  }
}
