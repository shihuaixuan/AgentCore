import type { QwenWorkReadResult } from "./qwenWorkDatabase";
import { ImportValidationError } from "./validation";

export type QwenWorkWorkerRequest = { raw: ArrayBuffer; page: number };
export type QwenWorkWorkerResponse =
  | { result: QwenWorkReadResult }
  | { error: ImportValidationError["code"] };

export async function readQwenWorkInWorker(raw: ArrayBuffer, page: number) {
  const worker = new Worker(new URL("./qwenWorkWorker.ts", import.meta.url), {
    type: "module",
  });
  return new Promise<QwenWorkReadResult>((resolve, reject) => {
    function finish() {
      clearTimeout(timeout);
      worker.terminate();
    }

    function unavailable() {
      finish();
      reject(new ImportValidationError("qwenwork-reader"));
    }

    const timeout = setTimeout(unavailable, 60_000);
    worker.onmessage = ({ data }: MessageEvent<QwenWorkWorkerResponse>) => {
      finish();
      if ("error" in data) reject(new ImportValidationError(data.error));
      else resolve(data.result);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      unavailable();
    };
    worker.onmessageerror = unavailable;
    try {
      const request: QwenWorkWorkerRequest = { raw, page };
      worker.postMessage(request, [raw]);
    } catch {
      unavailable();
    }
  });
}
