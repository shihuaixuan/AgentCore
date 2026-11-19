export type ConnectionState = boolean | "needs_expert_grant" | null;

export interface CapabilityListing {
  id: string;
  name: string;
  purpose: string;
  kind: string;
  class?: string;
  connected?: ConnectionState;
  eager?: boolean;
}

export interface ConnectionBadge {
  label: string;
  className: string;
}

export interface CapabilityListOutput {
  type: "capability_list";
  query: string;
  capabilities: CapabilityListing[];
  count: number;
  fallback?: CapabilityListing[];
  service?: string | null;
  message?: string;
}

export interface FindCapabilityInput {
  query?: string;
  context?: string;
  kind?: string;
}

export interface FindCapabilityToolPart {
  type: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
}

export function parseOutput(output: unknown): CapabilityListOutput | null {
  if (!output) return null;
  if (typeof output === "string") {
    const trimmed = output.trim();
    if (!trimmed) return null;
    try {
      return parseOutput(JSON.parse(trimmed) as unknown);
    } catch {
      return null;
    }
  }
  if (typeof output === "object") {
    const candidate = output as { type?: unknown; capabilities?: unknown };
    if (
      candidate.type === "capability_list" &&
      Array.isArray(candidate.capabilities)
    ) {
      return output as CapabilityListOutput;
    }
  }
  return null;
}

export function queryOf(part: FindCapabilityToolPart): string | undefined {
  // `input` is whatever the model streamed, so `query` is not necessarily a
  // string -- and this runs while the call is still streaming.
  const query = (part.input as FindCapabilityInput | undefined)?.query;
  return typeof query === "string" ? query.trim() : undefined;
}

export function getAnimationText(
  part: FindCapabilityToolPart,
  t = (english: string, _chinese: string) => english,
): string {
  const query = queryOf(part);
  const queryText = query ? ` for "${query}"` : "";
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return t(
        `Searching capabilities${queryText}`,
        `正在搜索能力${query ? `：“${query}”` : ""}`,
      );
    case "output-available": {
      const parsed = parseOutput(part.output);
      if (parsed) {
        return t(
          `Found ${parsed.count} capabilit${parsed.count === 1 ? "y" : "ies"}${queryText}`,
          `找到 ${parsed.count} 项能力${query ? `：“${query}”` : ""}`,
        );
      }
      return t(
        `Searched capabilities${queryText}`,
        `已搜索能力${query ? `：“${query}”` : ""}`,
      );
    }
    case "output-error":
      return t(
        `Search failed${queryText}`,
        `搜索失败${query ? `：“${query}”` : ""}`,
      );
    default:
      return t("Searching capabilities", "正在搜索能力");
  }
}

export function connectionBadge(
  item: CapabilityListing,
  t = (english: string, _chinese: string) => english,
): ConnectionBadge | null {
  if (item.connected === undefined || item.connected === null) return null;
  if (item.connected === "needs_expert_grant") {
    return {
      label: t("grant needed", "需要授权"),
      className: "bg-warning-surface text-warning-foreground",
    };
  }
  if (item.connected) {
    return {
      label: t("connected", "已连接"),
      className: "bg-success-surface text-success-foreground",
    };
  }
  return {
    label: t("sign in", "登录"),
    className: "bg-surface-hover text-foreground-tertiary",
  };
}

export function kindLabel(
  item: CapabilityListing,
  t = (english: string, _chinese: string) => english,
): string {
  if (item.kind === "mcp_server") return t("integration", "集成");
  if (item.kind === "skill") return t("skill", "技能");
  if (item.class === "primitive") return t("building block", "基础模块");
  if (item.kind === "tool") return t("tool", "工具");
  return t("action", "动作");
}
