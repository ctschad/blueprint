#!/usr/bin/env python3

import argparse
import json
import sys
from typing import Any

import litert_lm


def extract_text(message: dict[str, Any]) -> str:
    content = message.get("content", [])

    if isinstance(content, str):
        return content.strip()

    text_parts: list[str] = []
    for item in content:
        if isinstance(item, dict) and item.get("type") == "text":
            text = item.get("text")
            if isinstance(text, str) and text.strip():
                text_parts.append(text.strip())

    return " ".join(text_parts).strip()


def print_message(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--backend", choices=("cpu", "gpu"), default="cpu")
    args = parser.parse_args()

    backend = litert_lm.Backend.CPU if args.backend == "cpu" else litert_lm.Backend.GPU
    litert_lm.set_min_log_severity(litert_lm.LogSeverity.SILENT)

    try:
        with litert_lm.Engine(args.model, backend=backend, max_num_tokens=4096) as engine:
            print_message({"type": "ready"})

            for raw_line in sys.stdin:
                line = raw_line.strip()
                if not line:
                    continue

                request_id = None
                try:
                    payload = json.loads(line)
                    request_id = str(payload["id"])
                    prompt = str(payload["prompt"])

                    with engine.create_conversation() as conversation:
                        response = conversation.send_message(prompt)
                    text = extract_text(response)

                    print_message(
                        {
                            "type": "response",
                            "id": request_id,
                            "ok": True,
                            "text": text,
                        }
                    )
                except Exception as error:  # noqa: BLE001
                    print_message(
                        {
                            "type": "response",
                            "id": request_id,
                            "ok": False,
                            "error": str(error),
                        }
                    )
    except Exception as error:  # noqa: BLE001
        print_message({"type": "fatal", "error": str(error)})
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
