import { getGetV1ListProvidersMockHandler200 } from "@/app/api/__generated__/endpoints/integrations/integrations.msw";
import {
  getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler200,
  getPostV2StoreABearerTokenForAnMcpServerMockHandler200,
  getPostV2StoreABearerTokenForAnMcpServerMockHandler401,
} from "@/app/api/__generated__/endpoints/mcp/mcp.msw";
import type { CredentialsMetaResponse } from "@/app/api/__generated__/models/credentialsMetaResponse";
import { server } from "@/mocks/mock-server";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConnectServiceDialog } from "../ConnectServiceDialog";

const oauthURL = "https://mcp-gw.dingtalk.com/oauth/server/mail";
const keyEndpoint = "https://mcp-gw.dingtalk.com/server/mail-fixture";
const credential: CredentialsMetaResponse = {
  id: "saved-mail-credential",
  host: keyEndpoint,
  provider: "mcp",
  type: "oauth2",
  title: null,
  scopes: null,
  username: null,
};

async function openPreset() {
  const onConnected = vi.fn();
  const onOpenChange = vi.fn();
  const user = userEvent.setup();
  server.use(
    getGetV1ListProvidersMockHandler200([
      {
        name: "mcp_dingtalk_mail",
        service: "dingtalk_mail",
        service_name: "DingTalk Mail",
        supported_auth_types: [],
        mcp_server: {
          server_url: oauthURL,
          connection_mode: "hosted",
          documentation_url: "https://aihub.dingtalk.com/",
          setup_instructions:
            "Sign in or paste the API Key URL for DingTalk Mail.",
          auth_methods: ["oauth", "query_key"],
        },
      },
    ]),
  );
  render(
    <ConnectServiceDialog
      open
      initialProviderId="mcp_dingtalk_mail"
      onConnected={onConnected}
      onOpenChange={onOpenChange}
    />,
  );
  await screen.findByRole("tab", { name: "Sign in" });
  return { user, onConnected, onOpenChange };
}

describe("DingTalk Mail preset", () => {
  it("offers a locked OAuth endpoint and separately saves the service URL and key", async () => {
    const requests: unknown[] = [];
    server.use(
      getPostV2StoreABearerTokenForAnMcpServerMockHandler200(
        async ({ request }) => {
          requests.push(await request.json());
          return credential;
        },
      ),
      getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler200(
        async ({ request }) => {
          requests.push(await request.json());
          return { tools: [] };
        },
      ),
    );
    const { user, onConnected, onOpenChange } = await openPreset();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Sign in",
      "API Key URL",
    ]);
    const oauthInput = screen.getByLabelText<HTMLInputElement>("Server URL");
    expect(oauthInput.value).toBe(oauthURL);
    expect(oauthInput.readOnly).toBe(true);
    await user.click(screen.getByRole("tab", { name: "API Key URL" }));
    expect(screen.queryByLabelText("Server URL")).toBeNull();
    const input = screen.getByLabelText<HTMLInputElement>(
      "DingTalk Mail API Key URL",
    );
    expect(input.type).toBe("password");
    expect(input.value).toBe("");
    await user.click(input);
    await user.paste(`${keyEndpoint}?key=fixture%2Bvalue%3D`);
    await user.click(screen.getByRole("button", { name: "Save API key" }));
    await waitFor(() => expect(onConnected).toHaveBeenCalledWith(credential));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(requests).toEqual([
      {
        server_url: keyEndpoint,
        token: "fixture+value=",
        auth_type: "query_key",
      },
    ]);
  });

  it("rejects other hosts, paths and malformed keys, without echoing a save error", async () => {
    server.use(
      getPostV2StoreABearerTokenForAnMcpServerMockHandler401({
        detail: "fixture-secret",
      }),
    );
    const { user, onConnected, onOpenChange } = await openPreset();
    await user.click(screen.getByRole("tab", { name: "API Key URL" }));
    const input = screen.getByLabelText("DingTalk Mail API Key URL");
    const save = screen.getByRole<HTMLButtonElement>("button", {
      name: "Save API key",
    });
    for (const value of [
      "fixture-secret",
      "https://mcp-gw.dingtalk.com.example.org/server/mail?key=x",
      "https://user@mcp-gw.dingtalk.com/server/mail?key=x",
      `${oauthURL}?key=x`,
      `${keyEndpoint}?key=x&key=y`,
      `${keyEndpoint}?key=`,
    ]) {
      fireEvent.change(input, { target: { value } });
      expect(save.disabled).toBe(true);
    }
    fireEvent.change(input, {
      target: { value: `${keyEndpoint}?key=fixture-secret` },
    });
    await user.click(save);
    expect((await screen.findByRole("alert")).textContent).not.toContain(
      "fixture-secret",
    );
    expect(onConnected).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
