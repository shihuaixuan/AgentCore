import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  openQwenWorkReader,
  readQwenWorkInWorker,
  type QwenWorkWorkerResponse,
} from "../readQwenWorkInWorker";

const workers: StubWorker[] = [];

class StubWorker {
  onmessage: ((event: MessageEvent<QwenWorkWorkerResponse>) => void) | null =
    null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    workers.push(this);
  }

  reply(data: QwenWorkWorkerResponse) {
    this.onmessage?.(new MessageEvent("message", { data }));
  }
}

const firstPage = { entries: [], skipped: 100, page: 0, hasOlder: true };
const lastPage = { entries: [], skipped: 1, page: 1, hasOlder: false };

beforeEach(() => {
  vi.stubGlobal("Worker", StubWorker);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  workers.length = 0;
});

async function openReader(controller = new AbortController()) {
  const opening = openQwenWorkReader(new ArrayBuffer(100), controller.signal);
  const [worker] = workers;
  worker.reply({ type: "opened", total: 101 });
  return { reader: await opening, worker, controller };
}

describe("QwenWork Worker client", () => {
  it("transfers the DB once and reads multiple pages on the same worker", async () => {
    const raw = new ArrayBuffer(100);
    const controller = new AbortController();
    const opening = openQwenWorkReader(raw, controller.signal);
    const [worker] = workers;
    expect(worker.postMessage).toHaveBeenCalledWith({ type: "open", raw }, [
      raw,
    ]);
    worker.reply({ type: "opened", total: 101 });
    const reader = await opening;
    expect(reader.total).toBe(101);

    const newer = reader.readPage(0);
    expect(worker.postMessage).toHaveBeenLastCalledWith(
      { type: "read-page", page: 0 },
      [],
    );
    worker.reply({ type: "page", result: firstPage });
    await expect(newer).resolves.toEqual(firstPage);

    const older = reader.readPage(1);
    expect(worker.postMessage).toHaveBeenLastCalledWith(
      { type: "read-page", page: 1 },
      [],
    );
    worker.reply({ type: "page", result: lastPage });
    await expect(older).resolves.toEqual(lastPage);

    expect(workers).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(worker.terminate).not.toHaveBeenCalled();
    reader.close();
    reader.close();
    controller.abort();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    await expect(reader.readPage(0)).rejects.toThrow("qwenwork-reader");
  });

  it("keeps the manual one-shot API and releases its worker", async () => {
    const result = readQwenWorkInWorker(new ArrayBuffer(100), 1);
    const [worker] = workers;
    worker.reply({ type: "opened", total: 101 });
    await vi.waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(2));
    worker.reply({ type: "page", result: lastPage });
    await expect(result).resolves.toEqual(lastPage);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("does not allocate a worker for an already-aborted request", async () => {
    await expect(
      openQwenWorkReader(new ArrayBuffer(100), AbortSignal.abort()),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(workers).toHaveLength(0);
  });

  it("aborts an in-progress open", async () => {
    const controller = new AbortController();
    const opening = openQwenWorkReader(new ArrayBuffer(100), controller.signal);
    controller.abort();
    await expect(opening).rejects.toBe(controller.signal.reason);
    expect(workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborts an in-progress page and rejects future reads", async () => {
    const { controller, reader, worker } = await openReader();
    const pending = reader.readPage(0);
    controller.abort();
    await expect(pending).rejects.toBe(controller.signal.reason);
    await expect(reader.readPage(1)).rejects.toBe(controller.signal.reason);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects an in-progress page on explicit close", async () => {
    const { reader, worker } = await openReader();
    const pending = reader.readPage(0);
    reader.close();
    await expect(pending).rejects.toThrow("qwenwork-reader");
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects both reads if a second page is requested before the first completes", async () => {
    const { reader, worker } = await openReader();
    const pending = reader.readPage(0);
    const second = reader.readPage(1);
    await Promise.all([
      expect(pending).rejects.toThrow("qwenwork-reader"),
      expect(second).rejects.toThrow("qwenwork-reader"),
    ]);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["open", "page"])("tears down on a timed-out %s", async (stage) => {
    const pending =
      stage === "open"
        ? openQwenWorkReader(new ArrayBuffer(100), new AbortController().signal)
        : (await openReader()).reader.readPage(0);
    vi.advanceTimersByTime(60_000);
    await expect(pending).rejects.toThrow("qwenwork-reader");
    expect(workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("propagates typed database errors and releases the worker", async () => {
    const { reader, worker } = await openReader();
    const pending = reader.readPage(0);
    worker.reply({ type: "error", code: "qwenwork-database" });
    await expect(pending).rejects.toThrow("qwenwork-database");
    await expect(reader.readPage(1)).rejects.toThrow("qwenwork-database");
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("releases the worker after a failed postMessage or Worker error", async () => {
    const { reader, worker } = await openReader();
    worker.postMessage.mockImplementationOnce(() => {
      throw new DOMException("Synthetic clone failure", "DataCloneError");
    });
    await expect(reader.readPage(0)).rejects.toThrow("qwenwork-reader");
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);

    const next = openQwenWorkReader(
      new ArrayBuffer(100),
      new AbortController().signal,
    );
    const otherWorker = workers[1];
    const event = new ErrorEvent("error", { cancelable: true });
    otherWorker.onerror?.(event);
    await expect(next).rejects.toThrow("qwenwork-reader");
    expect(event.defaultPrevented).toBe(true);
    expect(otherWorker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
