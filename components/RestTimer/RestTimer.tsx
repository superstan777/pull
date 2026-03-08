"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const DURATION = 90; // seconds

interface RestTimerProps {
  onDone: () => void;
}

export function RestTimer({ onDone }: RestTimerProps) {
  const [seconds, setSeconds] = useState(DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (intervalRef.current !== null) clearInterval(intervalRef.current);
          // Slight delay so user sees 0:00 briefly
          setTimeout(onDone, 400);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [onDone]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;

  // Progress arc (SVG circle)
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / DURATION;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-10">
      {/* Circular progress */}
      <div className="relative flex items-center justify-center">
        <svg
          width="220"
          height="220"
          className="-rotate-90"
          viewBox="0 0 220 220"
        >
          {/* Track */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted"
          />
          {/* Progress */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="text-primary transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Time label */}
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-bold tabular-nums tracking-tight">
            {display}
          </span>
          <span className="text-sm text-muted-foreground mt-1">rest</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="h-12 px-8 text-base"
        onClick={onDone}
      >
        Skip Rest
      </Button>
    </div>
  );
}
