"use client";

import { useState, useRef } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SetLog } from "@/lib/firestore";
import { cn } from "@/lib/utils";

interface SetRowProps {
  set: SetLog;
  exerciseIndex: number;
  setIndex: number;
  onLog: (
    exerciseIndex: number,
    setIndex: number,
    weight: number | null,
    reps: number | null,
  ) => Promise<void>;
}

export function SetRow({ set, exerciseIndex, setIndex, onLog }: SetRowProps) {
  const isLogged = set.loggedAt !== null;

  const [weight, setWeight] = useState(
    set.weight !== null ? String(set.weight) : "",
  );
  const [reps, setReps] = useState(set.reps !== null ? String(set.reps) : "");
  const [optimisticLogged, setOptimisticLogged] = useState(isLogged);
  const [disabled, setDisabled] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);

  async function handleLog() {
    setDisabled(true);
    setOptimisticLogged(true);

    const w = weight ? parseFloat(weight) : null;
    const r = reps ? parseInt(reps) : null;

    try {
      await onLog(exerciseIndex, setIndex, w, r);
    } catch {
      setOptimisticLogged(isLogged);
    }

    // Re-enable after 200ms debounce
    setTimeout(() => setDisabled(false), 200);
  }

  return (
    <div
      ref={rowRef}
      className={cn(
        "flex items-center gap-2 px-1 py-2 rounded-lg transition-colors",
        optimisticLogged && "opacity-60",
      )}
    >
      <span className="text-sm text-muted-foreground w-12 shrink-0">
        Set {set.setNumber}
      </span>

      <Input
        type="text"
        inputMode="decimal"
        placeholder="kg"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="h-12 text-lg flex-1 min-w-0"
        disabled={optimisticLogged}
        onFocus={() =>
          rowRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      />

      <Input
        type="text"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="h-12 text-lg flex-1 min-w-0"
        disabled={optimisticLogged}
        onFocus={() =>
          rowRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      />

      <Button
        variant={optimisticLogged ? "secondary" : "default"}
        size="icon"
        className="h-12 w-12 shrink-0"
        onClick={handleLog}
        disabled={disabled || optimisticLogged}
        aria-label={`Log set ${set.setNumber}`}
      >
        <Check
          className={cn("h-5 w-5", optimisticLogged && "text-green-500")}
        />
      </Button>
    </div>
  );
}
