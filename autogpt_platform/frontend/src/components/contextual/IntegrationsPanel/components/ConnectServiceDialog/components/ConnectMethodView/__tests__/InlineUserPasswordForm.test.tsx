import { server } from "@/mocks/mock-server";
import { render, screen, waitFor } from "@/tests/integrations/test-utils";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/molecules/Toast/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
  useToastOnFail: () => () => {},
}));

import { InlineUserPasswordForm } from "../InlineUserPasswordForm";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

const CREATE_CREDENTIALS_URL =
  "http://localhost:3000/api/proxy/api/integrations/:provider/credentials";

async function findConnectButton() {
  return (await screen.findByRole("button", {
    name: "Connect",
  })) as HTMLButtonElement;
}

async function fillLogin() {
  await userEvent.type(await screen.findByLabelText("Name"), "My login");
  await userEvent.type(await screen.findByLabelText("Username"), "user");
  await userEvent.type(await screen.findByLabelText("Password"), "pass");
}

function capturePosts(provider: string) {
  const posted = vi.fn();
  server.use(
    http.post(CREATE_CREDENTIALS_URL, async ({ request }) => {
      posted(await request.json());
      return HttpResponse.json(
        { id: "cred-1", provider, type: "user_password", title: "My login" },
        { status: 201 },
      );
    }),
  );
  return posted;
}

describe("InlineUserPasswordForm for a login sent to a server the workflow names", () => {
  it("localizes app-owned name validation without modifying the typed username", async () => {
    render(
      <LanguageProvider>
        <InlineUserPasswordForm
          provider="smtp"
          providerName="SMTP"
          onSuccess={vi.fn()}
        />
      </LanguageProvider>,
    );
    const name = await screen.findByLabelText("名称");
    await userEvent.type(name, "Original-name");
    await userEvent.clear(name);
    await userEvent.type(screen.getByLabelText("用户名"), "Original-user");
    expect(await screen.findByText("请输入名称")).toBeDefined();
    expect(screen.getByLabelText("用户名")).toHaveProperty(
      "value",
      "Original-user",
    );
  });

  it("uses localized server validation in the inline form without submitting an invalid server", async () => {
    const posted = capturePosts("smtp");
    render(
      <LanguageProvider>
        <InlineUserPasswordForm
          provider="smtp"
          providerName="SMTP"
          onSuccess={vi.fn()}
        />
      </LanguageProvider>,
    );
    await userEvent.type(
      await screen.findByLabelText("服务器"),
      "smtp.example.com:65536",
    );
    expect(
      await screen.findByText(
        "请输入有效的服务器地址，例如 smtp.example.com 或 smtp.example.com:587（端口范围为 1-65535）",
      ),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "连接" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(posted).not.toHaveBeenCalled();
  });

  it("keeps Connect disabled until the server is filled in", async () => {
    render(
      <InlineUserPasswordForm
        provider="smtp"
        providerName="SMTP"
        onSuccess={vi.fn()}
      />,
    );

    await fillLogin();
    expect((await findConnectButton()).disabled).toBe(true);

    await userEvent.type(
      await screen.findByLabelText("Server"),
      "smtp.example.com:587",
    );
    await waitFor(async () =>
      expect((await findConnectButton()).disabled).toBe(false),
    );
  });

  it("only takes a host or host:port as the server", async () => {
    render(
      <InlineUserPasswordForm
        provider="smtp"
        providerName="SMTP"
        onSuccess={vi.fn()}
      />,
    );

    await fillLogin();
    await userEvent.type(
      await screen.findByLabelText("Server"),
      "smtp://user@smtp.example.com",
    );

    expect(
      await screen.findByText(
        "Enter a valid server, like smtp.example.com or smtp.example.com:587 (port 1-65535)",
      ),
    ).toBeDefined();
    expect((await findConnectButton()).disabled).toBe(true);
  });

  it.each([
    [
      "smtp",
      "SMTP",
      "smtp.example.com:99999",
      "Enter a valid server, like smtp.example.com or smtp.example.com:587 (port 1-65535)",
    ],
    [
      "database",
      "Database",
      "db.example.com:0",
      "Enter a valid server, like db.example.com or db.example.com:5432 (port 1-65535)",
    ],
  ])(
    "refuses a %s server whose port is out of range, before submitting",
    async (provider, providerName, server, message) => {
      render(
        <InlineUserPasswordForm
          provider={provider}
          providerName={providerName}
          onSuccess={vi.fn()}
        />,
      );

      await fillLogin();
      await userEvent.type(await screen.findByLabelText("Server"), server);

      expect(await screen.findByText(message)).toBeDefined();
      expect((await findConnectButton()).disabled).toBe(true);
    },
  );

  it("saves an SMTP login scoped to smtp://<server>", async () => {
    const posted = capturePosts("smtp");
    const onSuccess = vi.fn();
    render(
      <InlineUserPasswordForm
        provider="smtp"
        providerName="SMTP"
        onSuccess={onSuccess}
      />,
    );

    await userEvent.type(
      await screen.findByLabelText("Server"),
      "SMTP.Example.com:587",
    );
    await fillLogin();
    await userEvent.click(await findConnectButton());

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(posted).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "smtp://smtp.example.com:587" }),
    );
  });

  it("saves a database login scoped to the engine's scheme", async () => {
    const posted = capturePosts("database");
    const onSuccess = vi.fn();
    render(
      <InlineUserPasswordForm
        provider="database"
        providerName="Database"
        onSuccess={onSuccess}
      />,
    );

    await userEvent.type(
      await screen.findByLabelText("Server"),
      "db.example.com",
    );
    await fillLogin();
    await userEvent.click(await findConnectButton());

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(posted).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "user_password",
        scope: "postgresql://db.example.com",
        username: "user",
      }),
    );
  });
});

describe("InlineUserPasswordForm for a provider with a fixed server", () => {
  it("does not ask for a server", async () => {
    const posted = capturePosts("webshare_proxy");
    const onSuccess = vi.fn();
    render(
      <InlineUserPasswordForm
        provider="webshare_proxy"
        providerName="Webshare"
        onSuccess={onSuccess}
      />,
    );

    await fillLogin();
    expect(screen.queryByLabelText("Server")).toBeNull();
    await userEvent.click(await findConnectButton());

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(posted.mock.calls[0][0]).not.toHaveProperty("scope");
  });
});
