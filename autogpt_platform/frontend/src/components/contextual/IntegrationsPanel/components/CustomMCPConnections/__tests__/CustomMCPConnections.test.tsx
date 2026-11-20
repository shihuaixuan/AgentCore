import { render, screen } from "@/tests/integrations/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "@/mocks/mock-server";
import { getGetV1ListProvidersMockHandler200 } from "@/app/api/__generated__/endpoints/integrations/integrations.msw";
import {
  getGetV2ListConnectionsMockHandler200,
  getPostV2CreateConnectionMockHandler200,
  getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler200,
  getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler401,
  getPostV2StoreABearerTokenForAnMcpServerMockHandler200,
  getPutV2UpdateConnectionMockHandler200,
} from "@/app/api/__generated__/endpoints/mcp/mcp.msw";
import userEvent from "@testing-library/user-event";

import { CustomMCPConnections } from "../CustomMCPConnections";
import { useCustomMCPConnections } from "../useCustomMCPConnections";
import { CustomMCPConnectionRow } from "../CustomMCPConnectionRow";

function ConnectionsHarness() {
  const state = useCustomMCPConnections();
  return (
    <>
      <button onClick={state.create}>Add custom MCP</button>
      {state.connections.map((connection) => (
        <CustomMCPConnectionRow
          key={connection.id}
          connection={connection}
          onEdit={() => state.edit(connection)}
          onRemove={() => state.setPendingRemove(connection)}
          busy={state.busy}
        />
      ))}
      <CustomMCPConnections state={state} />
    </>
  );
}

describe("CustomMCPConnections", () => {
  beforeEach(() => server.use(getGetV1ListProvidersMockHandler200([])));

  it("stores a pasted DingTalk key separately and only probes by credential ID", async () => {
    const serverURL = "https://mcp-gw.dingtalk.com/server/fixture";
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(
      getGetV2ListConnectionsMockHandler200([]),
      getPostV2StoreABearerTokenForAnMcpServerMockHandler200(
        async ({ request }) => {
          bodies.push(await request.json());
          return {
            id: "cred",
            provider: "mcp",
            type: "oauth2",
            title: null,
            scopes: null,
            username: null,
          };
        },
      ),
      getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler200(
        async ({ request }) => {
          bodies.push(await request.json());
          return { tools: [] };
        },
      ),
      getPostV2CreateConnectionMockHandler200(async ({ request }) => {
        bodies.push(await request.json());
        return {
          id: "saved",
          name: "Mail",
          server_url: serverURL,
          auth_type: "query_key",
          credential_id: "cred",
        };
      }),
    );
    render(<ConnectionsHarness />);
    await user.click(screen.getByRole("button", { name: "Add custom MCP" }));
    await user.type(screen.getByLabelText("Name"), "Mail");
    const input = screen.getByLabelText("Server URL");
    await user.click(input);
    await user.paste(`${serverURL}?key=fixture%2Bvalue%3D`);
    expect((input as HTMLInputElement).value).toBe(serverURL);
    expect(screen.getByLabelText("Credential").getAttribute("type")).toBe(
      "password",
    );
    expect(screen.queryByRole("combobox")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Test and save" }));
    await screen.findByRole("button", { name: "Add custom MCP" });
    expect(bodies).toEqual([
      {
        server_url: serverURL,
        token: "fixture+value=",
        auth_type: "query_key",
        isolated: true,
      },
      {
        server_url: serverURL,
        credential_id: "cred",
        use_saved_credentials: false,
      },
      {
        server_url: serverURL,
        credential_id: "cred",
        name: "Mail",
        description: "",
        enabled: true,
        auth_type: "query_key",
      },
    ]);
  });

  it("allows disabling an existing connection without contacting its server", async () => {
    let enabled = true;
    const connection = {
      id: "connection-1",
      name: "Weather",
      description: "Forecasts",
      server_url: "https://weather.example.com/mcp",
      auth_type: "basic" as const,
      credential_id: "saved-legacy-credential",
      enabled: true,
    };
    server.use(
      getGetV1ListProvidersMockHandler200([
        {
          name: "weather",
          mcp_server: {
            server_url: connection.server_url,
            auth_methods: ["oauth"],
            documentation_url: "https://weather.example.com/docs",
            setup_instructions: "Fixture",
            connection_mode: "hosted",
          },
        },
      ]),
      getGetV2ListConnectionsMockHandler200(() => [{ ...connection, enabled }]),
      getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler401({
        detail: "Server unavailable",
      }),
      getPutV2UpdateConnectionMockHandler200(async ({ request }) => {
        const updated = await request.json();
        expect(updated).toMatchObject({
          auth_type: "basic",
          credential_id: "saved-legacy-credential",
        });
        enabled = false;
        return { ...connection, enabled };
      }),
    );
    render(<ConnectionsHarness />);
    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(await screen.findByText("Disabled")).toBeDefined();
  });

  it("offers a way to add a custom MCP server", () => {
    server.use(getGetV2ListConnectionsMockHandler200([]));
    render(<ConnectionsHarness />);
    expect(
      screen.getByRole("button", { name: "Add custom MCP" }),
    ).toBeDefined();
  });

  it("tests and saves a public server", async () => {
    const saved = {
      id: "connection-1",
      name: "Weather",
      description: "Forecasts",
      server_url: "https://weather.example.com/mcp",
      auth_type: "none" as const,
      credential_id: null,
      enabled: true,
    };
    let created = false;
    server.use(
      getGetV2ListConnectionsMockHandler200(() => (created ? [saved] : [])),
      getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler200({
        tools: [
          { name: "get_weather", description: "Weather", input_schema: {} },
        ],
      }),
      getPostV2CreateConnectionMockHandler200(() => {
        created = true;
        return saved;
      }),
    );
    render(<ConnectionsHarness />);
    await userEvent.click(
      screen.getByRole("button", { name: "Add custom MCP" }),
    );
    await userEvent.type(screen.getByLabelText("Name"), "Weather");
    await userEvent.type(screen.getByLabelText("Description"), "Forecasts");
    await userEvent.type(
      screen.getByLabelText("Server URL"),
      "https://weather.example.com/mcp",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Test and save",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    await userEvent.click(
      screen.getByRole("button", { name: "Configure authentication manually" }),
    );
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: "None" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Test and save" }),
    );
    expect(await screen.findByText("Weather")).toBeDefined();
  });
});
