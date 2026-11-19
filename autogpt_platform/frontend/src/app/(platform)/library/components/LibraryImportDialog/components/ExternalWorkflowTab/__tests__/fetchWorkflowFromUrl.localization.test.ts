import { expect, it, vi, afterEach } from "vitest";
import { fetchWorkflowFromUrl } from "../fetchWorkflowFromUrl";

afterEach(() => vi.unstubAllGlobals());

it("localizes import errors without fetching an unsupported user URL", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const result = await fetchWorkflowFromUrl(
    "https://private.example/workflow",
    "zh-CN",
  );
  expect(result).toEqual({
    ok: false,
    error:
      "链接无效或不受支持。链接导入仅支持 n8n.io 工作流模板（例如 https://n8n.io/workflows/1234）。其他平台请使用文件上传。",
  });
  expect(fetch).not.toHaveBeenCalled();
});
