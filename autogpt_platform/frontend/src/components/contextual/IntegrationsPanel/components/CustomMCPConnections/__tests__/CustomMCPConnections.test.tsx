import { render, screen } from "@/tests/integrations/test-utils";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/mock-server";
import {
  getGetV2ListConnectionsMockHandler200,
  getPostV2CreateConnectionMockHandler200,
  getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler200,
  getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler401,
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
  it("allows disabling an existing connection without contacting its server", async () => {
    let enabled = true;
    const connection = {
      id: "connection-1",
      name: "Weather",
      description: "Forecasts",
      server_url: "https://weather.example.com/mcp",
      auth_type: "none" as const,
      credential_id: null,
      enabled: true,
    };
    server.use(
      getGetV2ListConnectionsMockHandler200(() => [{ ...connection, enabled }]),
      getPostV2DiscoverAvailableToolsOnAnMcpServerMockHandler401({
        detail: "Server unavailable",
      }),
      getPutV2UpdateConnectionMockHandler200(() => {
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
    await userEvent.click(
      screen.getByRole("button", { name: "Test and save" }),
    );
    expect(await screen.findByText("Weather")).toBeDefined();
  });
});
