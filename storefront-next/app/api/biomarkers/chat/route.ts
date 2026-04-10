import {
  BIOMARKERS_ASSISTANT_FALLBACK,
  BIOMARKERS_ASSISTANT_UNAVAILABLE,
  BiomarkersAssistantTurn,
  buildBiomarkersPrompt,
  normalizeBiomarkersQuestion,
  normalizeBiomarkersAssistantResponse,
  shouldRefuseBiomarkersQuestion
} from "@/lib/biomarkers-assistant";
import { askBiomarkersWorker, ensureBiomarkersWorker } from "@/lib/biomarkers-llm-runtime";
import { headers } from "next/headers";

export const runtime = "nodejs";

type BiomarkersChatRequest = {
  history?: BiomarkersAssistantTurn[];
  question?: string;
};

function normalizeHistory(history: unknown): BiomarkersAssistantTurn[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (turn): turn is BiomarkersAssistantTurn =>
        typeof turn === "object" &&
        turn !== null &&
        "role" in turn &&
        "content" in turn &&
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string"
    )
    .slice(-6);
}

function isLocalHost(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  const withoutPort = normalized.startsWith("[")
    ? normalized
    : normalized.includes(":") && normalized.split(":").length === 2
      ? normalized.split(":")[0] ?? normalized
      : normalized;

  return [
    "127.0.0.1",
    "::1",
    "[::1]",
    "::ffff:127.0.0.1",
    "0:0:0:0:0:ffff:127.0.0.1",
    "localhost"
  ].includes(withoutPort);
}

function extractForwardedIp(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() ?? "";
}

function isLocalUrlHost(value: string | null | undefined) {
  if (!value) {
    return true;
  }

  try {
    return isLocalHost(new URL(value).host);
  } catch {
    return false;
  }
}

async function isLocalRequest(request?: Request) {
  const url = request ? new URL(request.url) : null;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || url?.host;
  const origin = requestHeaders.get("origin");
  const referer = requestHeaders.get("referer");
  const forwardedFor = extractForwardedIp(requestHeaders.get("x-forwarded-for"));

  if (!isLocalHost(host)) {
    return false;
  }

  if (forwardedFor && !isLocalHost(forwardedFor)) {
    return false;
  }

  if (!isLocalUrlHost(origin)) {
    return false;
  }

  if (!isLocalUrlHost(referer)) {
    return false;
  }

  return true;
}

export async function GET() {
  if (!(await isLocalRequest())) {
    return Response.json({ ok: false, answer: BIOMARKERS_ASSISTANT_UNAVAILABLE, fallback: true }, { status: 403 });
  }

  try {
    await ensureBiomarkersWorker();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, answer: BIOMARKERS_ASSISTANT_UNAVAILABLE, fallback: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isLocalRequest(request))) {
    return Response.json(
      { ok: false, answer: BIOMARKERS_ASSISTANT_UNAVAILABLE, fallback: true },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as BiomarkersChatRequest | null;
  const question = body?.question?.trim() || "";
  const normalizedQuestion = normalizeBiomarkersQuestion(question);
  const history = normalizeHistory(body?.history);

  if (!question) {
    return Response.json(
      { ok: false, answer: BIOMARKERS_ASSISTANT_FALLBACK, fallback: true },
      { status: 400 }
    );
  }

  if (shouldRefuseBiomarkersQuestion(normalizedQuestion)) {
    return Response.json({ ok: true, answer: BIOMARKERS_ASSISTANT_FALLBACK, fallback: true });
  }

  try {
    const prompt = buildBiomarkersPrompt(normalizedQuestion, history);
    const rawAnswer = await askBiomarkersWorker(prompt);
    const answer = normalizeBiomarkersAssistantResponse(rawAnswer);
    const fallback =
      answer === BIOMARKERS_ASSISTANT_FALLBACK ||
      answer.startsWith(BIOMARKERS_ASSISTANT_FALLBACK);

    return Response.json({ ok: true, answer, fallback });
  } catch (error) {
    if (error instanceof Error && error.message.includes("at capacity")) {
      return Response.json(
        { ok: false, answer: BIOMARKERS_ASSISTANT_UNAVAILABLE, fallback: true },
        { status: 429 }
      );
    }

    return Response.json(
      { ok: false, answer: BIOMARKERS_ASSISTANT_UNAVAILABLE, fallback: true },
      { status: 503 }
    );
  }
}
