import { Toaster } from "@/components/molecules/Toast/toaster";
import { LanguageProvider, useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useContext, type ContextType, type ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import CredentialsProvider, {
  CredentialsActionsContext,
  CredentialsProvidersContext,
} from "../credentials-provider";

const api = vi.hoisted(() => ({
  listProviders: vi.fn(),
  listSystemProviders: vi.fn(),
  listCredentials: vi.fn(),
  oAuthCallback: vi.fn(),
}));
vi.mock("@/lib/autogpt-server-api/context", () => ({
  useBackendAPI: () => api,
}));
vi.mock("@/lib/auth/hooks/useAuth", () => ({
  useAuth: () => ({ isLoggedIn: true, isUserLoading: false }),
}));

const clients: QueryClient[] = [];
const snapshots: Array<{
  providers: ContextType<typeof CredentialsProvidersContext>;
  actions: ContextType<typeof CredentialsActionsContext>;
}> = [];

function LanguageSwitch() {
  const { locale, setLocale } = useTranslation();
  return (
    <button onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")}>
      Switch language
    </button>
  );
}

function CredentialsProbe() {
  const providers = useContext(CredentialsProvidersContext);
  const actions = useContext(CredentialsActionsContext);
  snapshots.push({ providers, actions });
  const github = providers?.github;
  return (
    <>
      <span>
        {github?.savedCredentials
          .map((credential) => credential.title)
          .join(",") ?? "Loading"}
      </span>
      <button
        disabled={!github}
        onClick={() =>
          github
            ?.oAuthCallback("Original-Code", "Original-State")
            .catch(() => undefined)
        }
      >
        Connect
      </button>
    </>
  );
}

function mount(locale: Locale = "en") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </QueryClientProvider>
    );
  }
  return render(
    <>
      <LanguageSwitch />
      <CredentialsProvider>
        <CredentialsProbe />
      </CredentialsProvider>
      <Toaster />
    </>,
    { wrapper: Wrapper },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  snapshots.length = 0;
  api.listProviders.mockResolvedValue(["github"]);
  api.listSystemProviders.mockResolvedValue([]);
  api.listCredentials.mockResolvedValue([
    {
      id: "Original-ID",
      provider: "github",
      type: "api_key",
      title: "Original credential",
    },
  ]);
  api.oAuthCallback.mockRejectedValue(new Error("Original OAuth error"));
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  sonnerToast.dismiss();
});

describe("credentials provider locale independence", () => {
  test("switching languages does not reload credentials or provider metadata or replace actions", async () => {
    mount();
    await screen.findByText("Original credential");
    await act(async () => undefined);
    const loaded = snapshots.at(-1);
    expect(api.listProviders).toHaveBeenCalledTimes(1);
    expect(api.listSystemProviders).toHaveBeenCalledTimes(1);
    expect(api.listCredentials).toHaveBeenCalledTimes(1);

    for (const locale of ["zh-CN", "en"]) {
      fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
      await act(async () => undefined);
      expect(document.documentElement.lang).toBe(locale);
      expect(api.listProviders).toHaveBeenCalledTimes(1);
      expect(api.listSystemProviders).toHaveBeenCalledTimes(1);
      expect(api.listCredentials).toHaveBeenCalledTimes(1);
      expect(snapshots.at(-1)?.providers).toBe(loaded?.providers);
      expect(snapshots.at(-1)?.actions).toBe(loaded?.actions);
      expect(screen.getByText("Original credential")).toBeDefined();
    }

    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(await screen.findByText("无法完成 OAuth 身份验证")).toBeDefined();
    expect(screen.getByText("Original OAuth error")).toBeDefined();
    expect(api.oAuthCallback).toHaveBeenCalledTimes(1);
    expect(api.oAuthCallback).toHaveBeenCalledWith(
      "github",
      "Original-Code",
      "Original-State",
    );
  });

  test("switching language does not retire an in-flight provider list", async () => {
    let finish!: (providers: string[]) => void;
    api.listProviders.mockReturnValueOnce(
      new Promise<string[]>((resolve) => {
        finish = resolve;
      }),
    );
    mount();
    try {
      await waitFor(() => expect(api.listProviders).toHaveBeenCalledTimes(1));
      fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
      await act(async () => undefined);
      expect(api.listProviders).toHaveBeenCalledTimes(1);
      expect(api.listSystemProviders).toHaveBeenCalledTimes(1);
      expect(api.listCredentials).not.toHaveBeenCalled();
    } finally {
      await act(async () => finish(["github"]));
    }
    expect(await screen.findByText("Original credential")).toBeDefined();
    expect(api.listCredentials).toHaveBeenCalledTimes(1);
  });

  test.each([
    { locale: "en" as const, title: "无法加载凭据" },
    { locale: "zh-CN" as const, title: "Unable to load credentials" },
  ])(
    "uses the latest language for an in-flight list failure starting in $locale",
    async ({ locale, title }) => {
      let fail!: (error: Error) => void;
      api.listCredentials.mockReturnValueOnce(
        new Promise<never>((_resolve, reject) => {
          fail = reject;
        }),
      );
      mount(locale);
      try {
        await waitFor(() =>
          expect(api.listCredentials).toHaveBeenCalledTimes(1),
        );
        fireEvent.click(
          screen.getByRole("button", { name: "Switch language" }),
        );
        await act(async () => undefined);
        expect(api.listCredentials).toHaveBeenCalledTimes(1);
      } finally {
        await act(async () => fail(new Error("Original list error")));
      }
      expect(await screen.findByText(title)).toBeDefined();
      expect(screen.getByText("Original list error")).toBeDefined();
      expect(api.listCredentials).toHaveBeenCalledTimes(1);
    },
  );
});
