import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { useStoreCategories } from "../useStoreCategories";
import { useAgentSafeMode } from "../useAgentSafeMode";
import { expect, it, vi } from "vitest";
import { useState, type ReactNode } from "react";
import type { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";

const { notify, mutate } = vi.hoisted(() => ({
  notify: vi.fn(),
  mutate: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/components/molecules/Toast/use-toast", () => ({
  useToast: () => ({ toast: notify }),
}));
vi.mock("@/app/api/__generated__/endpoints/graphs/graphs", () => ({
  usePatchV1UpdateGraphSettings: () => ({
    mutateAsync: mutate,
    isPending: false,
  }),
}));

function Wrapper({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <LanguageProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </LanguageProvider>
  );
}

it("localizes category placeholders without enabling a disabled query", () => {
  const { result } = renderHook(() => useStoreCategories({ enabled: false }), {
    wrapper: Wrapper,
  });
  expect(result.current.placeholder).toBe("选择分类");
});

it("localizes safe-mode confirmation while preserving the request payload", async () => {
  const graph = {
    id: "library-id",
    graph_id: "raw-graph-id",
    has_human_in_the_loop: true,
    settings: { human_in_the_loop_safe_mode: false },
  } as LibraryAgent;
  const { result } = renderHook(() => useAgentSafeMode(graph), {
    wrapper: Wrapper,
  });
  await result.current.handleHITLToggle();
  await waitFor(() =>
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "人工审核安全模式已启用",
        description: "人工参与模块需要手动审核",
      }),
    ),
  );
  expect(mutate).toHaveBeenCalledWith({
    graphId: "raw-graph-id",
    data: { human_in_the_loop_safe_mode: true },
  });
});
