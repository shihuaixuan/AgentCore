import type { QwenWorkReadResult } from "./qwenWorkDatabase";
import { ImportValidationError } from "./validation";

const REQUEST_TIMEOUT_MS = 60_000;

export type QwenWorkWorkerRequest =
  | { type: "open"; raw: ArrayBuffer }
  | { type: "read-page"; page: number };

type SuccessResponse =
  | { type: "opened"; total: number }
  | { type: "page"; result: QwenWorkReadResult };
export type QwenWorkWorkerResponse =
  | SuccessResponse
  | { type: "error"; code: ImportValidationError["code"] };

export type QwenWorkReader = {
  total: number;
  readPage(page: number): Promise<QwenWorkReadResult>;
  close(): void;
};

export async function readQwenWorkInWorker(raw: ArrayBuffer, page: number) {
  const reader = await openQwenWorkReader(raw, new AbortController().signal);
  try {
    return await reader.readPage(page);
  } finally {
    reader.close();
  }
}

export async function openQwenWorkReader(
  raw: ArrayBuffer,
  signal: AbortSignal,
): Promise<QwenWorkReader> {
  signal.throwIfAborted();
  const { request, close } = connectWorker(signal);
  const response = await request({ type: "open", raw }, [raw]);
  signal.throwIfAborted();
  if (
    response.type !== "opened" ||
    !Number.isSafeInteger(response.total) ||
    response.total < 0
  ) {
    close();
    throw new ImportValidationError("qwenwork-reader");
  }

  async function readPage(page: number) {
    const response = await request({ type: "read-page", page });
    signal.throwIfAborted();
    if (response.type === "page" && response.result?.page === page)
      return response.result;
    close();
    throw new ImportValidationError("qwenwork-reader");
  }

  return { total: response.total, readPage, close };
}

type PendingRequest = {
  resolve: (response: SuccessResponse) => void;
  reject: (error: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};

function connectWorker(signal: AbortSignal) {
  const worker = createWorker();
  let pending: PendingRequest | undefined;
  let closed: { error: unknown } | undefined;

  function takePending() {
    const request = pending;
    pending = undefined;
    if (request) clearTimeout(request.timeout);
    return request;
  }

  function dispose(error: unknown) {
    if (closed) return;
    closed = { error };
    signal.removeEventListener("abort", abort);
    worker.onmessage = null;
    worker.onerror = null;
    worker.onmessageerror = null;
    worker.terminate();
    takePending()?.reject(error);
  }

  function close() {
    dispose(new ImportValidationError("qwenwork-reader"));
  }

  function abort() {
    dispose(signal.reason);
  }

  function request(
    message: QwenWorkWorkerRequest,
    transfer: Transferable[] = [],
  ) {
    if (closed) return Promise.reject(closed.error);
    if (pending) {
      const error = new ImportValidationError("qwenwork-reader");
      dispose(error);
      return Promise.reject(error);
    }
    return new Promise<SuccessResponse>((resolve, reject) => {
      pending = {
        resolve,
        reject,
        timeout: setTimeout(close, REQUEST_TIMEOUT_MS),
      };
      try {
        worker.postMessage(message, transfer);
      } catch {
        close();
      }
    });
  }

  worker.onmessage = function onMessage({
    data,
  }: MessageEvent<QwenWorkWorkerResponse>) {
    if (data?.type === "error") dispose(new ImportValidationError(data.code));
    else if (pending && (data?.type === "opened" || data?.type === "page")) {
      takePending()?.resolve(data);
    } else {
      close();
    }
  };
  worker.onerror = function onWorkerError(event) {
    event.preventDefault();
    close();
  };
  worker.onmessageerror = close;
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  return { request, close };
}

function createWorker() {
  try {
    return new Worker(new URL("./qwenWorkWorker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    throw new ImportValidationError("qwenwork-reader");
  }
}
