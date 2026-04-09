"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SortOption = {
  value: string;
  label: string;
};

export function CollectionSort({
  collectionHandle,
  activeSort,
  activeSortLabel,
  options
}: {
  collectionHandle: string;
  activeSort: string;
  activeSortLabel: string;
  options: readonly SortOption[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`collection-sort ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="collection-sort__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>Sort By</span>
        <span className="collection-sort__value">{activeSortLabel}</span>
      </button>

      {open ? (
        <div className="collection-sort__menu" role="menu" aria-label="Sort products">
          {options.map((option) => {
            const href = `/collections/${collectionHandle}${option.value === "featured" ? "" : `?sort=${option.value}`}`;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={activeSort === option.value}
                className="collection-sort__option"
                onClick={() => {
                  setOpen(false);
                  router.push(href);
                }}
              >
                <span className={`collection-sort__check ${activeSort === option.value ? "is-active" : ""}`} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
