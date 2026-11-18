import {
  getGetV2ListManagedChatModelsMockHandler200,
  getGetV2ListManagedModelSettingsMockHandler200,
  getPatchV2UpdateManagedChatModelMockHandler200,
  getPostV2CreateManagedChatModelMockHandler201,
} from "@/app/api/__generated__/endpoints/chat/chat.msw";
import { server } from "@/mocks/mock-server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ManagedModelPicker } from "../../../copilot/components/ChatInput/components/ManagedModelPicker";
import { ManagedModelsSection } from "../ManagedModelsSection";

const auth = vi.hoisted(() => ({ user: { role: "admin" } }));
vi.mock("@/lib/auth/hooks/useAuthStore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/hooks/useAuthStore")>()),
  useAuthStore: (selector: (state: typeof auth) => unknown) => selector(auth),
}));

const modelID = "a8f78ebb-fdd1-41a0-a3ab-a61537ce07db";
const model = {
  id: modelID,
  name: "Company model",
  model: "company/fast",
  base_url: "https://models.example.com/v1",
  enabled: false,
};

function renderModels(ui: ReactElement) {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={cache}>{ui}</QueryClientProvider>);
}

describe("Chat model settings", () => {
  beforeEach(() => {
    auth.user.role = "admin";
  });

  it("creates a closed model and publishes it to the chat picker on approval", async () => {
    let configured = false;
    let enabled = false;
    server.use(
      getGetV2ListManagedModelSettingsMockHandler200(() =>
        configured ? [{ ...model, enabled }] : [],
      ),
      getGetV2ListManagedChatModelsMockHandler200(() =>
        enabled ? [{ id: model.id, name: model.name }] : [],
      ),
      getPostV2CreateManagedChatModelMockHandler201(async ({ request }) => {
        expect(await request.json()).toEqual({
          name: model.name,
          model: model.model,
          base_url: model.base_url,
          api_key: "test-key",
        });
        configured = true;
        return model;
      }),
      getPatchV2UpdateManagedChatModelMockHandler200(
        async ({ request, params }) => {
          expect(params.modelId).toBe(modelID);
          const update = (await request.json()) as { enabled: boolean };
          enabled = update.enabled;
          return { ...model, enabled };
        },
      ),
    );
    renderModels(
      <>
        <ManagedModelsSection />
        <ManagedModelPicker disabled={false} />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add model" }));
    for (const [label, value] of [
      ["Display name", model.name],
      ["Model ID", model.model],
      ["Base URL", model.base_url],
      ["API Key", "test-key"],
    ]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Save model" }));
    const toggle = await screen.findByRole("switch", {
      name: "Open Company model for chat",
    });
    const picker = screen.getByRole("combobox", { name: "Model" });
    expect(picker.hasAttribute("disabled")).toBe(true);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    await waitFor(() => expect(picker.textContent).toContain(model.name));
    expect(picker.hasAttribute("disabled")).toBe(false);
    fireEvent.click(toggle);
    await waitFor(() => expect(picker.hasAttribute("disabled")).toBe(true));
  });

  it("only shows the public catalog to a member", async () => {
    auth.user.role = "authenticated";
    server.use(
      getGetV2ListManagedChatModelsMockHandler200([
        { id: model.id, name: model.name },
      ]),
    );
    renderModels(<ManagedModelsSection />);
    expect(await screen.findByText(model.name)).toBeDefined();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByRole("button", { name: "Add model" })).toBeNull();
    expect(screen.queryByText(model.base_url)).toBeNull();
  });
});
