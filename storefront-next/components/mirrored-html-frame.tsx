"use client";

import { useEffect, useRef } from "react";

type Props = {
  html: string;
  title: string;
};

export function MirroredHtmlFrame({ html, title }: Props) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!frameRef.current) {
      return;
    }

    let resizeObserver: ResizeObserver | null = null;
    const imageCleanup = new Map<HTMLImageElement, () => void>();

    function syncHeight() {
      const frame = frameRef.current;
      const documentElement = frame?.contentDocument?.documentElement;
      const body = frame?.contentDocument?.body;

      if (!documentElement || !body) {
        return;
      }

      const nextHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        documentElement.scrollHeight,
        documentElement.offsetHeight,
        documentElement.clientHeight
      );

      frame.style.height = `${nextHeight}px`;
    }

    function attachObservers() {
      const frame = frameRef.current;
      const documentElement = frame?.contentDocument?.documentElement;
      const body = frame?.contentDocument?.body;

      if (!documentElement || !body) {
        return;
      }

      syncHeight();

      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => {
        syncHeight();
      });
      resizeObserver.observe(documentElement);
      resizeObserver.observe(body);

      imageCleanup.forEach((cleanup) => cleanup());
      imageCleanup.clear();

      frame.contentDocument?.querySelectorAll("img").forEach((image) => {
        const handleLoad = () => syncHeight();
        image.addEventListener("load", handleLoad);
        imageCleanup.set(image, () => image.removeEventListener("load", handleLoad));
      });

      window.setTimeout(syncHeight, 60);
      window.setTimeout(syncHeight, 220);
      window.setTimeout(syncHeight, 800);
    }

    const frame = frameRef.current;
    frame.addEventListener("load", attachObservers);
    attachObservers();

    return () => {
      frame.removeEventListener("load", attachObservers);
      resizeObserver?.disconnect();
      imageCleanup.forEach((cleanup) => cleanup());
      imageCleanup.clear();
    };
  }, [html]);

  return <iframe ref={frameRef} title={title} srcDoc={html} className="mirrored-html-frame" />;
}
