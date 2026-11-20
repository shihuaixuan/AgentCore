import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/tests/integrations/test-utils";
import { server } from "@/mocks/mock-server";
import { getGetV1ListProvidersMockHandler200 } from "@/app/api/__generated__/endpoints/integrations/integrations.msw";
import {
  getGetV2ListConnectionsMockHandler200,
  getPostV2StoreABearerTokenForAnMcpServerMockHandler422,
} from "@/app/api/__generated__/endpoints/mcp/mcp.msw";
import { CustomMCPConnections } from "../CustomMCPConnections";
import { useCustomMCPConnections } from "../useCustomMCPConnections";
import { dingTalkMailURL } from "../dingTalkKeyURL";

function Harness() {
  const state = useCustomMCPConnections();
  return (
    <>
      <button onClick={state.create}>Add</button>
      <CustomMCPConnections state={state} />
    </>
  );
}

async function openForm() {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole("button", { name: "Add" }));
  const url = screen.getByLabelText<HTMLInputElement>("Server URL");
  await user.click(url);
  return {
    user,
    url,
    save: screen.getByRole<HTMLButtonElement>("button", {
      name: "Test and save",
    }),
  };
}

describe("Endpoint fields", () => {
  beforeEach(() =>
    server.use(
      getGetV2ListConnectionsMockHandler200([]),
      getGetV1ListProvidersMockHandler200([]),
    ),
  );

  it("shows only the declared methods and switches to the catalog OAuth address", async () => {
    const url = "https://fixture.example/mcp";
    const oauth = "https://fixture.example/oauth";
    server.use(
      getGetV1ListProvidersMockHandler200([
        {
          name: "fixture",
          mcp_server: {
            server_url: url,
            oauth_server_url: oauth,
            auth_methods: ["bearer", "oauth", "none"],
            connection_mode: "hosted",
            documentation_url: url,
            setup_instructions: "Fixture",
          },
        },
      ]),
    );
    const form = await openForm();
    await form.user.paste(url);
    await form.user.click(await screen.findByRole("combobox"));
    expect(
      screen.getAllByRole("option").map((item) => item.textContent),
    ).toEqual(["Bearer", "OAuth", "None"]);
    await form.user.click(screen.getByRole("option", { name: "OAuth" }));
    expect(form.url.value).toBe(oauth);
  });

  it("requires the DingTalk key address instead of sending a key to the mail OAuth address", async () => {
    const { user, url, save } = await openForm();
    await user.paste(dingTalkMailURL);
    await user.click(screen.getByRole("combobox"));
    expect(
      screen.getAllByRole("option").map((item) => item.textContent),
    ).toEqual(["OAuth", "Query key"]);
    await user.click(screen.getByRole("option", { name: "Query key" }));
    expect(save.disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("/server/<id>");
    await user.click(url);
    await user.paste(
      "https://mcp-gw.dingtalk.com/server/fixture?key=test-only",
    );
    expect(url.value).toBe("https://mcp-gw.dingtalk.com/server/fixture");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(save.disabled).toBe(false);
    await user.paste("https://mcp-gw.dingtalk.com/server/another");
    expect(screen.getByLabelText<HTMLInputElement>("Credential").value).toBe(
      "",
    );
  });

  it("discards an unknown query, including a previously extracted key", async () => {
    const { user, url, save } = await openForm();
    await user.paste(
      "https://mcp-gw.dingtalk.com/server/fixture?key=test-only",
    );
    await user.paste("https://unlisted.example/mcp?token=other-fixture");
    expect(url.value).toBe("");
    expect(screen.getByRole("alert").textContent).not.toContain(
      "other-fixture",
    );
    expect(screen.queryByLabelText("Credential")).toBeNull();
    expect(save.disabled).toBe(true);
  });

  it("does not display or log upstream errors that echo the query credential", async () => {
    const { user, save } = await openForm();
    server.use(
      getPostV2StoreABearerTokenForAnMcpServerMockHandler422({
        detail: [
          { loc: ["body"], type: "invalid", msg: "Rejected ?key=test-only" },
        ],
      }),
    );
    await user.paste(
      "https://mcp-gw.dingtalk.com/server/fixture?key=test-only",
    );
    const log = vi.spyOn(console, "info");
    try {
      await user.click(save);
      const error = await screen.findByRole("alert");
      expect(error.textContent).toContain("Could not save");
      expect(error.textContent).not.toContain("test-only");
      expect(JSON.stringify(log.mock.calls)).not.toContain("test-only");
    } finally {
      log.mockRestore();
    }
  });
});
