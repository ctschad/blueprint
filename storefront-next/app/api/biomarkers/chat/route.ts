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

export async function GET() {
  try {
    await ensureBiomarkersWorker();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, answer: BIOMARKERS_ASSISTANT_UNAVAILABLE, fallback: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
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
  } catch {
    return Response.json(
      { ok: false, answer: BIOMARKERS_ASSISTANT_UNAVAILABLE, fallback: true },
      { status: 503 }
    );
  }
}
