"use client";

import {
  BIOMARKERS_ASSISTANT_FALLBACK,
  BIOMARKERS_ASSISTANT_UNAVAILABLE,
  BIOMARKERS_HEALTH_IMPACTS_HASH,
  BiomarkersAssistantTurn,
  shouldRefuseBiomarkersQuestion
} from "@/lib/biomarkers-assistant";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type AssistantMessage = BiomarkersAssistantTurn & {
  id: string;
  showFallbackLink?: boolean;
};

type BiomarkersLlmAssistantProps = {
  fallbackHref?: string;
};

type AssistantStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unavailable"
  | "error"
  | "responding";

const STARTER_QUESTIONS = [
  "What biomarkers do you track for mood?",
  "What's included in the Biomarkers membership?",
  "How often do I retest?"
];

function createMessage(
  role: "user" | "assistant",
  content: string,
  showFallbackLink = false
): AssistantMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    showFallbackLink
  };
}

export function BiomarkersLlmAssistant({
  fallbackHref = BIOMARKERS_HEALTH_IMPACTS_HASH
}: BiomarkersLlmAssistantProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "The local Biomarkers assistant is available."
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messages.length === 0 && !isBusy) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isBusy, messages]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "loading":
        return "Starting local model...";
      case "ready":
        return "Local assistant ready";
      case "unavailable":
        return "Assistant unavailable";
      case "error":
        return "Assistant unavailable";
      case "responding":
        return "Thinking...";
      default:
        return "Starts on first question";
    }
  }, [status]);

  async function submitQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question || isBusy) return;

    const userMessage = createMessage("user", question);
    const nextHistory: BiomarkersAssistantTurn[] = [...messages, userMessage].map(
      ({ role, content }) => ({ role, content })
    );

    setMessages((current) => [...current, userMessage]);
    setInput("");

    if (shouldRefuseBiomarkersQuestion(question)) {
      setMessages((current) => [
        ...current,
        createMessage("assistant", BIOMARKERS_ASSISTANT_FALLBACK, true)
      ]);
      return;
    }

    try {
      setIsBusy(true);
      setStatus(status === "ready" ? "responding" : "loading");
      setStatusMessage("Running your local Biomarkers model...");

      const response = await fetch("/api/biomarkers/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          history: nextHistory
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { answer?: string; fallback?: boolean }
        | null;

      const answer =
        typeof payload?.answer === "string"
          ? payload.answer
          : response.ok
            ? BIOMARKERS_ASSISTANT_FALLBACK
            : BIOMARKERS_ASSISTANT_UNAVAILABLE;
      const shouldShowFallbackLink = Boolean(payload?.fallback) || !response.ok;

      setMessages((current) => [
        ...current,
        createMessage("assistant", answer, shouldShowFallbackLink)
      ]);
      setStatus(response.ok ? "ready" : "unavailable");
      setStatusMessage(
        response.ok
          ? "The local Biomarkers assistant is ready."
          : "The local Biomarkers assistant isn’t available right now."
      );
    } catch {
      setStatus("unavailable");
      setStatusMessage("The local Biomarkers assistant isn’t available right now.");
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          BIOMARKERS_ASSISTANT_UNAVAILABLE,
          true
        )
      ]);
    } finally {
      setIsBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(input);
  }

  return (
    <div className="biomarkers-assistant">
      <div className="biomarkers-assistant__header">
        <div>
          <h2>Ask about Biomarkers</h2>
        </div>
        <span className={`biomarkers-assistant__status biomarkers-assistant__status--${status}`}>
          {statusLabel}
        </span>
      </div>

      <p className="biomarkers-assistant__intro">
        Ask about what Blueprint Biomarkers measures, specific biomarkers and their function, how
        the membership works, or how testing is structured. This assistant isn&apos;t intended for
        health advice.
      </p>

      <div className="biomarkers-assistant__starters" aria-label="Suggested Biomarkers questions">
        {STARTER_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            className="biomarkers-assistant__starter"
            onClick={() => void submitQuestion(question)}
            disabled={isBusy}
          >
            {question}
          </button>
        ))}
      </div>

      <div className="biomarkers-assistant__messages" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`biomarkers-assistant__message biomarkers-assistant__message--${message.role}`}
          >
            <p>{message.content}</p>
            {message.showFallbackLink ? (
              <a href={fallbackHref} className="biomarkers-assistant__fallback-link">
                See “Your health impacts how you feel” to review what we test
              </a>
            ) : null}
          </div>
        ))}

        {isBusy ? (
          <div className="biomarkers-assistant__message biomarkers-assistant__message--assistant biomarkers-assistant__message--pending">
            <p>Running the local Biomarkers model...</p>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {(status === "unavailable" || status === "error") && !isBusy ? (
        <div className="biomarkers-assistant__notice">
          <p>{statusMessage}</p>
          <a href={fallbackHref} className="biomarkers-assistant__notice-link">
            Go to “Your health impacts how you feel”
          </a>
        </div>
      ) : null}

      <form className="biomarkers-assistant__form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="biomarkers-assistant-input">
          Ask a question about Blueprint Biomarkers
        </label>
        <input
          id="biomarkers-assistant-input"
          type="text"
          className="biomarkers-assistant__input"
          placeholder="Ask what Biomarkers tests, includes, or how it works"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isBusy}
        />
        <button
          type="submit"
          className="biomarkers-assistant__submit"
          disabled={isBusy || input.trim().length === 0}
        >
          Ask
        </button>
      </form>
    </div>
  );
}
