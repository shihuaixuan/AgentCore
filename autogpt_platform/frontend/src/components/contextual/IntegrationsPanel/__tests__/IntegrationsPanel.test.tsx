import { getGetV2ListChatConnectionsMockHandler200 } from "@/app/api/__generated__/endpoints/chat/chat.msw";
import { getGetV2ListConnectionsMockHandler200 } from "@/app/api/__generated__/endpoints/mcp/mcp.msw";
import { getGetV1ListCredentialsMockHandler200 } from "@/app/api/__generated__/endpoints/integrations/integrations.msw";
import { server } from "@/mocks/mock-server";
import {
  render,
  screen,
  within,
  waitFor,
} from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { IntegrationsPanel } from "../IntegrationsPanel";

describe("IntegrationsPanel", () => {
  it("shows a custom connection once while keeping other accounts for the same server", async () => {
    const credential = {
      id: "custom-token",
      provider: "mcp",
      type: "oauth2" as const,
      title: "MCP: bound account",
      scopes: [],
      username: null,
      host: "https://weather.example.com/mcp",
      service: "weather",
      service_name: "Weather MCP Server",
    };
    server.use(
      getGetV2ListChatConnectionsMockHandler200({ offers: [] }),
      getGetV1ListCredentialsMockHandler200([
        credential,
        { ...credential, id: "separate-token", title: "MCP: separate account" },
      ]),
      getGetV2ListConnectionsMockHandler200([
        {
          id: "connection-1",
          name: "My Weather",
          description: "Forecasts",
          server_url: credential.host,
          auth_type: "bearer",
          credential_id: credential.id,
          enabled: true,
        },
      ]),
    );
    render(<IntegrationsPanel />);
    const tools = screen.getByRole("region", {
      name: "Tools your experts and workflows use",
    });
    expect(await within(tools).findByText("My Weather")).toBeDefined();
    expect(await within(tools).findByText("separate account")).toBeDefined();
    expect(within(tools).queryByText("bound account")).toBeNull();
    await userEvent.click(within(tools).getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Authentication").textContent).toContain(
      "Bearer",
    );
  });

  it("lists and searches custom MCP alongside existing tool connections", async () => {
    server.use(
      getGetV2ListChatConnectionsMockHandler200({ offers: [] }),
      getGetV1ListCredentialsMockHandler200([]),
      getGetV2ListConnectionsMockHandler200([
        {
          id: "connection-1",
          name: "Weather",
          description: "Forecasts",
          server_url: "https://weather.example.com/mcp",
          auth_type: "none",
          credential_id: null,
          enabled: true,
        },
      ]),
    );
    render(<IntegrationsPanel />);
    const tools = screen.getByRole("region", {
      name: "Tools your experts and workflows use",
    });
    expect(await within(tools).findByText("Weather")).toBeDefined();
    expect(within(tools).getByText("Custom MCP")).toBeDefined();
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search integrations" }),
      "missing",
    );
    await waitFor(() =>
      expect(within(tools).queryByText("Weather")).toBeNull(),
    );
    await userEvent.clear(
      screen.getByRole("textbox", { name: "Search integrations" }),
    );
    expect(await within(tools).findByText("Weather")).toBeDefined();
    await userEvent.click(within(tools).getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Name").getAttribute("value")).toBe("Weather");
  });

  it("shows tool connections without exposing the old AI subscription entry", async () => {
    server.use(
      getGetV2ListChatConnectionsMockHandler200({ offers: [] }),
      getGetV1ListCredentialsMockHandler200([]),
      getGetV2ListConnectionsMockHandler200([]),
    );

    render(<IntegrationsPanel />);

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Tools your experts and workflows use",
      "Available integrations",
    ]);
  });

  it("keeps the tools heading while the list is still loading", async () => {
    // The heading names what the region is, so it should not appear only once
    // the region has content -- the AI section above it behaves the same way.
    server.use(
      getGetV2ListChatConnectionsMockHandler200({ offers: [] }),
      getGetV2ListConnectionsMockHandler200([]),
    );

    render(<IntegrationsPanel />);

    expect(
      await screen.findByRole("heading", {
        name: "Tools your experts and workflows use",
      }),
    ).toBeDefined();
  });
});
