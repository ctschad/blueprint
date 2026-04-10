import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

export const runtime = "nodejs";

const MODEL_PATH = "/Users/charlesschad/Downloads/gemma-4-E2B-it.litertlm";
const MODEL_NAME = "gemma-4-E2B-it.litertlm";

function buildHeaders(contentLength: number, range?: { start: number; end: number; size: number }) {
  const headers = new Headers();
  headers.set("Content-Type", "application/octet-stream");
  headers.set("Content-Length", String(contentLength));
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Disposition", `inline; filename="${MODEL_NAME}"`);
  headers.set("Cache-Control", "no-store");

  if (range) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${range.size}`);
  }

  return headers;
}

function parseRangeHeader(rangeHeader: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match) return null;

  const [, startRaw, endRaw] = match;

  let start: number;
  let end: number;

  if (startRaw === "" && endRaw === "") return null;

  if (startRaw === "") {
    const suffixLength = Number.parseInt(endRaw, 10);
    if (Number.isNaN(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = Number.parseInt(startRaw, 10);
    end = endRaw ? Number.parseInt(endRaw, 10) : size - 1;
  }

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return null;
  }

  return {
    start,
    end: Math.min(end, size - 1)
  };
}

async function getFileSize() {
  const fileStat = await stat(MODEL_PATH).catch(() => null);
  return fileStat?.size ?? null;
}

export async function HEAD(request: Request) {
  const size = await getFileSize();
  if (size === null) {
    return new Response("Model file not found.", { status: 404 });
  }

  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) {
    return new Response(null, { status: 200, headers: buildHeaders(size) });
  }

  const range = parseRangeHeader(rangeHeader, size);
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: new Headers({
        "Content-Range": `bytes */${size}`,
        "Accept-Ranges": "bytes"
      })
    });
  }

  return new Response(null, {
    status: 206,
    headers: buildHeaders(range.end - range.start + 1, { ...range, size })
  });
}

export async function GET(request: Request) {
  const size = await getFileSize();
  if (size === null) {
    return new Response("Model file not found.", { status: 404 });
  }

  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) {
    const stream = createReadStream(MODEL_PATH);

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: buildHeaders(size)
    });
  }

  const range = parseRangeHeader(rangeHeader, size);
  if (!range) {
    return new Response("Invalid range.", {
      status: 416,
      headers: new Headers({
        "Content-Range": `bytes */${size}`,
        "Accept-Ranges": "bytes"
      })
    });
  }

  const stream = createReadStream(MODEL_PATH, { start: range.start, end: range.end });

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 206,
    headers: buildHeaders(range.end - range.start + 1, { ...range, size })
  });
}
