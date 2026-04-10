import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { getBiomarkersRuntimeAvailability } from "@/lib/biomarkers-runtime-config";

type WorkerMessage =
  | { type: "ready" }
  | { type: "fatal"; error?: string }
  | { type: "response"; id?: string; ok?: boolean; text?: string; error?: string };

type ActiveRequest = {
  id: string;
  reject: (error: Error) => void;
  resolve: (text: string) => void;
  timeout: NodeJS.Timeout;
};

type QueuedRequest = {
  id: string;
  prompt: string;
  reject: (error: Error) => void;
  resolve: (text: string) => void;
};

type WorkerState = {
  active: ActiveRequest | null;
  buffer: string;
  nextId: number;
  process: ChildProcessWithoutNullStreams | null;
  queue: QueuedRequest[];
  startPromise: Promise<void> | null;
  started: boolean;
};

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_QUEUED_REQUESTS = 2;

const globalForBiomarkers = globalThis as typeof globalThis & {
  __blueprintBiomarkersWorker?: WorkerState;
};

const workerState =
  globalForBiomarkers.__blueprintBiomarkersWorker ??
  (globalForBiomarkers.__blueprintBiomarkersWorker = {
    active: null,
    buffer: "",
    nextId: 0,
    process: null,
    queue: [],
    startPromise: null,
    started: false
  });

function isWorkerMessage(value: unknown): value is WorkerMessage {
  return typeof value === "object" && value !== null && "type" in value;
}

function resetWorkerProcess() {
  if (workerState.process) {
    workerState.process.removeAllListeners();
    workerState.process.kill();
  }

  workerState.process = null;
  workerState.buffer = "";
  workerState.startPromise = null;
  workerState.started = false;
}

function failActiveRequest(error: Error) {
  if (!workerState.active) {
    return;
  }

  clearTimeout(workerState.active.timeout);
  workerState.active.reject(error);
  workerState.active = null;
}

function scheduleNextRequest() {
  queueMicrotask(() => {
    void processQueue();
  });
}

function handleWorkerMessage(message: WorkerMessage, startResolve: () => void, startReject: (error: Error) => void) {
  if (message.type === "ready") {
    workerState.started = true;
    startResolve();
    return;
  }

  if (message.type === "fatal") {
    const error = new Error(message.error || "The Biomarkers worker failed to initialize.");
    resetWorkerProcess();
    failActiveRequest(error);
    startReject(error);
    scheduleNextRequest();
    return;
  }

  if (message.type !== "response" || !message.id || !workerState.active || workerState.active.id !== message.id) {
    return;
  }

  const active = workerState.active;
  clearTimeout(active.timeout);
  workerState.active = null;

  if (message.ok && typeof message.text === "string") {
    active.resolve(message.text);
  } else {
    active.reject(new Error(message.error || "The Biomarkers worker returned an invalid response."));
  }

  scheduleNextRequest();
}

export async function ensureBiomarkersWorker() {
  if (workerState.process && workerState.started) {
    return;
  }

  if (workerState.startPromise) {
    return workerState.startPromise;
  }

  const runtime = getBiomarkersRuntimeAvailability();

  if (!runtime.hasPython) {
    throw new Error("LiteRT-LM Python runtime is not installed locally.");
  }

  if (!runtime.hasWorkerScript) {
    throw new Error("Biomarkers worker script is missing.");
  }

  if (!runtime.hasModel) {
    throw new Error("The local Gemma model file was not found.");
  }

  workerState.startPromise = new Promise<void>((resolve, reject) => {
    const child = spawn(
      runtime.pythonPath,
      [runtime.workerScriptPath, "--model", runtime.modelPath, "--backend", runtime.backend],
      {
        cwd: runtime.projectRoot,
        stdio: ["pipe", "pipe", "pipe"]
      }
    );

    workerState.process = child;
    workerState.buffer = "";
    workerState.started = false;

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      workerState.buffer += chunk;

      let newlineIndex = workerState.buffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = workerState.buffer.slice(0, newlineIndex).trim();
        workerState.buffer = workerState.buffer.slice(newlineIndex + 1);

        if (line) {
          try {
            const parsed = JSON.parse(line) as unknown;
            if (isWorkerMessage(parsed)) {
              handleWorkerMessage(parsed, resolve, reject);
            }
          } catch {
            // Ignore non-JSON runtime noise from the Python process.
          }
        }

        newlineIndex = workerState.buffer.indexOf("\n");
      }
    });

    child.stderr.setEncoding("utf8");

    child.on("error", (error) => {
      resetWorkerProcess();
      failActiveRequest(error);
      reject(error);
      scheduleNextRequest();
    });

    child.on("exit", (code, signal) => {
      const error = new Error(
        workerState.started
          ? `The Biomarkers worker stopped unexpectedly (${signal || code || "unknown"}).`
          : `The Biomarkers worker failed to start (${signal || code || "unknown"}).`
      );
      resetWorkerProcess();
      failActiveRequest(error);
      if (!workerState.started) {
        reject(error);
      }
      scheduleNextRequest();
    });
  }).finally(() => {
    if (!workerState.started) {
      workerState.startPromise = null;
    }
  });

  return workerState.startPromise;
}

async function processQueue() {
  if (workerState.active || workerState.queue.length === 0) {
    return;
  }

  const next = workerState.queue.shift();
  if (!next) {
    return;
  }

  try {
    await ensureBiomarkersWorker();
  } catch (error) {
    next.reject(error instanceof Error ? error : new Error("The Biomarkers worker is unavailable."));
    scheduleNextRequest();
    return;
  }

  if (!workerState.process || !workerState.process.stdin.writable) {
    next.reject(new Error("The Biomarkers worker is unavailable."));
    scheduleNextRequest();
    return;
  }

  const timeout = setTimeout(() => {
    if (!workerState.active || workerState.active.id !== next.id) {
      return;
    }

    const timeoutError = new Error("The Biomarkers worker timed out.");
    resetWorkerProcess();
    failActiveRequest(timeoutError);
    scheduleNextRequest();
  }, REQUEST_TIMEOUT_MS);

  workerState.active = {
    id: next.id,
    reject: next.reject,
    resolve: next.resolve,
    timeout
  };

  try {
    workerState.process.stdin.write(`${JSON.stringify({ id: next.id, prompt: next.prompt })}\n`);
  } catch (error) {
    clearTimeout(timeout);
    workerState.active = null;
    next.reject(error instanceof Error ? error : new Error("Failed to contact the Biomarkers worker."));
    resetWorkerProcess();
    scheduleNextRequest();
  }
}

export async function askBiomarkersWorker(prompt: string) {
  if (workerState.queue.length >= MAX_QUEUED_REQUESTS) {
    throw new Error("The Biomarkers assistant is at capacity.");
  }

  const id = `req-${++workerState.nextId}`;

  return new Promise<string>((resolve, reject) => {
    workerState.queue.push({ id, prompt, reject, resolve });
    scheduleNextRequest();
  });
}
