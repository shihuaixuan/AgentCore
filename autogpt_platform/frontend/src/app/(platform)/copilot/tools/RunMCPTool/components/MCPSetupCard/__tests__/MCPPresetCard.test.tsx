import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import type { ProviderMetadata } from "@/app/api/__generated__/models/providerMetadata";
import { getPostV2StoreABearerTokenForAnMcpServerMockHandler200 } from "@/app/api/__generated__/endpoints/mcp/mcp.msw";
import { server } from "@/mocks/mock-server";
import userEvent from "@testing-library/user-event";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChainActionCard } from "../../../../../components/ChainActionCard/ChainActionCard";
import {
  ChainActionsContext,
  type ChainActionEntry,
} from "../../../../../components/ToolChain/chainActions";
import { MCPSetupCard } from "../MCPSetupCard";

const serverURL = "https://mcp.example.test/oauth/server/mail";
const preset: ProviderMetadata = {
  name: "mcp_dingtalk_mail",
  service: "dingtalk_mail",
  display_name: "DingTalk Mail",
  mcp_server: {
    server_url: serverURL,
    connection_mode: "hosted",
    auth_methods: ["oauth", "query_key"],
    documentation_url: "https://example.test/help",
    setup_instructions: "Use your mail connection.",
  },
};
const credential: CredentialsMetaResponse = {
  id: "mail-credential",
  provider: "mcp",
  type: "oauth2",
  host: "https://mcp.example.test/server/opaque",
  service: "dingtalk_mail",
  scopes: [],
  username: null,
  title: "Fake mail account",
};
let owned: CredentialsMetaResponse[];
let grants: { credential_id: string }[];
let grantsFresh: boolean;
let fetchingCredentials: boolean;
const send = vi.fn();
const grant = vi.fn();
vi.mock("@/app/api/__generated__/endpoints/mcp/mcp", async (original) => ({
  ...(await original<object>()),
  useGetV2ListBindableQueryKeys: () => ({ data: { status: 200, data: [] } }),
}));
vi.mock("@/services/experts/grant-to-expert", () => ({
  grantToExpert: (...args: unknown[]) => grant(...args),
}));
vi.mock(
  "../../../../../components/CopilotChatActionsProvider/useCopilotChatActions",
  () => ({ useCopilotChatActions: () => ({ onSend: send }) }),
);
vi.mock(
  "@/app/api/__generated__/endpoints/integrations/integrations",
  async (original) => ({
    ...(await original<object>()),
    useGetV1ListProviders: () => ({ data: [preset] }),
    useGetV1ListCredentials: () => ({
      data: owned,
      isFetchedAfterMount: true,
      isFetching: fetchingCredentials,
    }),
  }),
);
vi.mock(
  "@/app/api/__generated__/endpoints/experts/experts",
  async (original) => ({
    ...(await original<object>()),
    useListExpertCredentials: () => ({
      data: grants,
      isFetchedAfterMount: grantsFresh,
    }),
  }),
);

function Surface({
  grouped,
  url = serverURL,
}: {
  grouped: boolean;
  url?: string;
}) {
  const [entry, register] = useState<ChainActionEntry>();
  const [actions] = useState(() => ({
    register: (_owner: string, next: ChainActionEntry) => register(next),
    unregister: () => register(undefined),
  }));
  const output = {
    message:
      "You're connected to DingTalk Mail. Use Reconnect to swap accounts.",
    setup_info: {
      agent_id: url,
      agent_name: "DingTalk Mail",
      mcp_catalog_id: preset.name,
      mcp_expert_id: "mail-expert",
      user_readiness: { has_all_credentials: true, missing_credentials: {} },
    },
  };
  return (
    <ChainActionsContext.Provider value={grouped ? actions : null}>
      <div hidden={grouped}>
        <MCPSetupCard output={output} />
      </div>
      {grouped && (
        <ChainActionCard
          mcp={entry?.mcp ? [entry.mcp] : []}
          connectors={[]}
          inputs={[]}
          questions={[]}
          manualProceed={false}
          isReady={!!entry?.ready}
          onProceed={vi.fn()}
        />
      )}
    </ChainActionsContext.Provider>
  );
}

describe.each([true, false])("MCP preset card (grouped=%s)", (grouped) => {
  beforeEach(() => {
    owned = [];
    grants = [];
    grantsFresh = true;
    fetchingCredentials = false;
    vi.clearAllMocks();
  });

  it("opens the locked preset and grants its new API key before retrying", async () => {
    const user = userEvent.setup();
    const stored = {
      ...credential,
      host: "https://mcp-gw.dingtalk.com/server/fixture",
    };
    server.use(getPostV2StoreABearerTokenForAnMcpServerMockHandler200(stored));
    grant.mockImplementationOnce(async () => {
      owned = [stored];
      grants = [{ credential_id: stored.id }];
      return true;
    });
    render(<Surface grouped={grouped} />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: /^connect( dingtalk mail)?$/i,
      }),
    );
    expect(await screen.findByRole("tab", { name: "Sign in" })).toBeDefined();
    expect(screen.getByLabelText<HTMLInputElement>("Server URL").readOnly).toBe(
      true,
    );
    const key = screen.getByRole("tab", { name: "API Key URL" });
    await user.click(key);
    const input = await screen.findByLabelText("DingTalk Mail API Key URL");
    expect(
      screen.queryByRole("button", { name: /back to services/i }),
    ).toBeNull();
    expect(grant).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    fireEvent.change(input, {
      target: { value: `${stored.host}?key=fixture` },
    });
    await user.click(screen.getByRole("button", { name: "Save API key" }));
    await waitFor(() =>
      expect(grant).toHaveBeenCalledWith(
        expect.anything(),
        "mail-expert",
        stored.id,
      ),
    );
    expect(send).toHaveBeenCalledOnce();
    expect(
      screen.getByText(
        grouped ? "1 of 1 ready" : /connected to DingTalk Mail/i,
      ),
    ).toBeDefined();
  });

  it("offers the matching account credential only as an explicit grant", async () => {
    owned = [credential];
    grant.mockResolvedValueOnce(false);
    render(<Surface grouped={grouped} />);
    expect(screen.queryByText(/^connected( to|$)/i)).toBeNull();
    expect(screen.queryByText(/you're connected/i)).toBeNull();
    fireEvent.click(
      await screen.findByRole("button", { name: "Grant access" }),
    );
    await waitFor(() =>
      expect(grant).toHaveBeenCalledWith(
        expect.anything(),
        "mail-expert",
        credential.id,
      ),
    );
    expect(await screen.findByText(/could not grant/i)).toBeDefined();
    expect(send).not.toHaveBeenCalled();
  });

  it("counts a fresh exact service grant, and drops readiness when revoked", () => {
    owned = [credential];
    grants = [{ credential_id: credential.id }];
    const { rerender } = render(<Surface grouped={grouped} />);
    expect(
      screen.getByText(
        grouped ? "1 of 1 ready" : /connected to DingTalk Mail/i,
      ),
    ).toBeDefined();
    grants = [];
    rerender(<Surface grouped={grouped} />);
    expect(screen.getByRole("button", { name: "Grant access" })).toBeDefined();
    expect(send).not.toHaveBeenCalled();
  });

  it("does not trust a stale grant, a sibling service, or an unfamiliar requested URL", () => {
    owned = [credential];
    grants = [{ credential_id: credential.id }];
    grantsFresh = false;
    const { rerender } = render(<Surface grouped={grouped} />);
    const notReady = () =>
      expect(screen.queryByText(/^connected( to|$)/i)).toBeNull();
    notReady();
    grantsFresh = true;
    fetchingCredentials = true;
    rerender(<Surface grouped={grouped} />);
    notReady();
    fetchingCredentials = false;
    owned = [{ ...credential, service: "dingtalk_docs" }];
    rerender(<Surface grouped={grouped} />);
    notReady();
    owned = [credential];
    rerender(<Surface grouped={grouped} url={`${serverURL}/other`} />);
    notReady();
    expect(screen.queryByRole("button", { name: "Grant access" })).toBeNull();
  });
});
