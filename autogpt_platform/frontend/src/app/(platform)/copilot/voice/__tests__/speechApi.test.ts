import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../helpers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../helpers")>()),
  getCopilotAuthHeaders: vi.fn(async () => ({ Authorization: "Bearer test" })),
}));

vi.mock("@/services/environment", () => ({
  environment: { getAGPTServerBaseUrl: () => "http://backend" },
}));

import { synthesizeSpeech, transcribeUtterance } from "../speechApi";
import { CopilotAuthError, getCopilotAuthHeaders } from "../../helpers";

function audioResponse() {
  return new Response(new Blob(["mp3"]), { status: 200 });
}

describe("synthesizeSpeech", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(audioResponse));
    vi.mocked(getCopilotAuthHeaders).mockReset().mockResolvedValue({
      Authorization: "Bearer test",
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("posts the text and session to the backend, authenticated", async () => {
    await synthesizeSpeech("A first phrase.", "session-1");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://backend/api/chat/speech");
    expect(JSON.parse(init!.body as string)).toEqual({
      text: "A first phrase.",
      session_id: "session-1",
    });
    expect((init!.headers as Record<string, string>).Authorization).toBe(
      "Bearer test",
    );
  });

  it("surfaces the status code when synthesis is refused", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 404 }));

    await expect(synthesizeSpeech("Flag is off.", null)).rejects.toThrow("404");
  });

  it.each([
    { locale: "zh-CN" as const, message: "身份验证失败，请重新登录。" },
    {
      locale: "en" as const,
      message: "Authentication failed — please sign in again.",
    },
    {
      locale: undefined,
      message: "Authentication failed — please sign in again.",
    },
  ])(
    "localizes only the authentication message in $locale and retains the error instance and metadata",
    async ({ locale, message }) => {
      const cause = new Error("Raw token failure");
      const failure = Object.assign(new CopilotAuthError(), {
        code: "AUTH_TOKEN_MISSING",
        status: 401,
        cause,
      });
      vi.mocked(getCopilotAuthHeaders).mockRejectedValueOnce(failure);

      const result = await synthesizeSpeech(
        "Original reply",
        "raw-session",
        locale,
      ).catch((error: unknown) => error);

      expect(result).toBe(failure);
      expect(result).toBeInstanceOf(CopilotAuthError);
      expect(result).toMatchObject({
        name: "CopilotAuthError",
        message,
        code: "AUTH_TOKEN_MISSING",
        status: 401,
      });
      expect(failure.cause).toBe(cause);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([
    new Error("Authentication failed — raw provider detail"),
    Object.assign(new Error("Raw auth gateway failure"), {
      name: "CopilotAuthError",
      code: "GATEWAY_E401",
    }),
  ])(
    "preserves non-CopilotAuthError header failures verbatim",
    async (failure) => {
      const originalMessage = failure.message;
      vi.mocked(getCopilotAuthHeaders).mockRejectedValueOnce(failure);

      await expect(
        synthesizeSpeech("Original reply", "raw-session", "zh-CN"),
      ).rejects.toBe(failure);
      expect(failure.message).toBe(originalMessage);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("preserves raw synthesis transport failures", async () => {
    const failure = Object.assign(
      new TypeError("Raw speech transport failure"),
      {
        code: "SPEECH_NETWORK_ERROR",
      },
    );
    vi.mocked(fetch).mockRejectedValueOnce(failure);

    await expect(
      synthesizeSpeech("Original reply", "raw-session", "zh-CN"),
    ).rejects.toBe(failure);
    expect(failure.message).toBe("Raw speech transport failure");
    expect(failure.code).toBe("SPEECH_NETWORK_ERROR");
  });

  it("localizes synthesis refusal without changing the request text", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 429 }));
    await expect(
      synthesizeSpeech("Original English reply", "raw-session", "zh-CN"),
    ).rejects.toThrow("你已达到使用上限，语音回复将暂停至额度重置。");
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).text,
    ).toBe("Original English reply");
  });

  it.each([
    {
      status: 429,
      message:
        "You've reached your usage limit — voice replies are paused until it resets.",
    },
    {
      status: 402,
      message: "Voice replies need an active AutoGPT subscription.",
    },
    {
      status: 503,
      message: "Voice replies are unavailable right now. Try again shortly.",
    },
  ])(
    "explains how to recover from HTTP $status",
    async ({ status, message }) => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status }));

      await expect(synthesizeSpeech("A reply.", "session-1")).rejects.toThrow(
        new Error(message),
      );
    },
  );
});

describe("transcribeUtterance", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("uploads the clip to the existing transcribe route", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ text: "run it" }));

    await expect(transcribeUtterance(new Blob(["wav"]))).resolves.toBe(
      "run it",
    );
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/transcribe");
  });

  it("returns an empty transcript when the route sends no text", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({}));

    await expect(transcribeUtterance(new Blob(["wav"]))).resolves.toBe("");
  });

  it("raises the route's own error message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { error: "OpenAI API key not configured" },
        { status: 401 },
      ),
    );

    await expect(transcribeUtterance(new Blob(["wav"]))).rejects.toThrow(
      "OpenAI API key not configured",
    );
  });
});
