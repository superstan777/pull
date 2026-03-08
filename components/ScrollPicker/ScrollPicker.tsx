"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ITEM_H = 44;
const VISIBLE = 5;
const CONTAINER_H = ITEM_H * VISIBLE; // 220px
const PAD = ITEM_H * 2; // 88px top/bottom padding so first/last item can centre

interface ScrollPickerProps {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ScrollPicker({
  items,
  value,
  onChange,
  label,
}: ScrollPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialIdx = Math.max(0, items.indexOf(value));
  const [liveIdx, setLiveIdx] = useState(initialIdx);

  // Set scroll position instantly on mount (no animation)
  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = initialIdx * ITEM_H;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync scroll if value changes externally (e.g. reset)
  useEffect(() => {
    if (busy.current || !listRef.current) return;
    const idx = Math.max(0, items.indexOf(value));
    listRef.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    setLiveIdx(idx);
  }, [value, items]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setLiveIdx(clamped); // live highlight update

    busy.current = true;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      onChange(items[clamped]);
      setTimeout(() => {
        busy.current = false;
      }, 60);
    }, 80);
  }

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      {label && (
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      )}
      <div className="relative w-full" style={{ height: CONTAINER_H }}>
        {/* Selection highlight band — behind the scroll list (no z-index, DOM order handles stacking) */}
        <div
          className="absolute left-1 right-1 pointer-events-none rounded-xl bg-muted"
          style={{ top: PAD, height: ITEM_H }}
        />
        {/* Scrollable list */}
        <div
          ref={listRef}
          className="absolute inset-0 overflow-y-scroll no-scrollbar"
          style={{ scrollSnapType: "y mandatory" }}
          onScroll={handleScroll}
        >
          <div style={{ height: PAD }} />
          {items.map((item, i) => {
            const dist = Math.abs(i - liveIdx);
            return (
              <div
                key={item}
                style={{ height: ITEM_H, scrollSnapAlign: "center" }}
                className={cn(
                  "flex items-center justify-center text-xl font-semibold select-none transition-opacity duration-75",
                  dist === 0
                    ? "opacity-100"
                    : dist === 1
                      ? "opacity-40"
                      : "opacity-15",
                )}
              >
                {item}
              </div>
            );
          })}
          <div style={{ height: PAD }} />
        </div>
        {/* Top fade */}
        <div
          className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
          style={{
            height: PAD,
            background:
              "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
          }}
        />
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          style={{
            height: PAD,
            background:
              "linear-gradient(to top, var(--background) 0%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}
