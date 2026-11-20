import { describe, expect, it } from "vitest";
import type { ProviderMetadata } from "@/app/api/__generated__/models/providerMetadata";
import { dingTalkMailURL, parseDingTalkKeyURL } from "../dingTalkKeyURL";
import { endpointAuthOptions, readServerInput } from "../endpointAuth";

const serverURL = "https://mcp-gw.dingtalk.com/server/Test_1-id";

describe("DingTalk key links", () => {
  it("returns only the clean server URL and a once-decoded key", () => {
    expect(parseDingTalkKeyURL(`${serverURL}?key=fixture%2B%3D%252F`)).toEqual({
      serverURL,
      token: "fixture+=%2F",
    });
  });

  it.each([
    "?key=",
    "?other=fixture",
    "?key=one&key=two",
    "?x=one&key=two",
    "?key=one&",
    "?key=one#fragment",
    "?key=%",
    "?key=%FF",
    "?key=%0A",
    "?key=%20",
    "?key=%00",
    "?key=%E4%B8%AD",
    "?key=one?key=two",
    "?key=one;other=two",
    "&key=fixture",
    "%253Fkey=fixture",
  ])("rejects ambiguous or malformed query: %s", (suffix) => {
    expect(readServerInput(serverURL + suffix)).toEqual({
      serverURL: "",
      token: "",
      rejected: true,
    });
  });

  it.each([
    serverURL.replace("https:", "http:"),
    serverURL.replace(".com/", ".com.example/"),
    serverURL.replace(".com/", ".com:444/"),
    serverURL.replace("://", "://user@"),
    serverURL.replace("/server/", "/other/../server/"),
    serverURL.replace("/server/", "/Server/"),
    serverURL + "%2Fextra",
    dingTalkMailURL,
    "not a URL",
  ])("never extracts or retains a key for %s", (url) => {
    expect(parseDingTalkKeyURL(`${url}?key=fixture`)).toBeNull();
    expect(readServerInput(`${url}?key=fixture`).serverURL).toBe("");
  });
});

describe("catalog auth", () => {
  const toolURL = "https://fixture.example/tools";
  const oauthURL = "https://fixture.example/oauth";
  const regionalURL = "https://eu.fixture.example/tools";
  const catalog: ProviderMetadata[] = [
    {
      name: "fixture",
      mcp_server: {
        server_url: toolURL,
        oauth_server_url: oauthURL,
        server_url_options: [{ label: "EU", url: regionalURL }],
        auth_methods: ["none", "oauth", "bearer"],
        connection_mode: "hosted",
        documentation_url: "https://fixture.example/docs",
        setup_instructions: "Fixture",
      },
    },
  ];

  it("maps declared methods to the corresponding exact endpoints", () => {
    expect(endpointAuthOptions(regionalURL, catalog)).toEqual([
      { method: "none", endpoint: regionalURL },
      { method: "oauth", endpoint: oauthURL },
      { method: "bearer", endpoint: regionalURL },
    ]);
    expect(endpointAuthOptions(oauthURL, catalog)[2]).toEqual({
      method: "bearer",
      endpoint: toolURL,
    });
    expect(endpointAuthOptions(toolURL + "-other", catalog)).toEqual([]);
    expect(
      endpointAuthOptions("https://fixture.example/docs", catalog),
    ).toEqual([]);
  });
});
