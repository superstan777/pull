"use client";

import { ArrowLeft, CheckCircle2, Dumbbell } from "lucide-react";
import { LogSetDrawer } from "@/components/LogSetDrawer";
import { RestTimer } from "@/components/RestTimer";
import { Button } from "@/components/ui/button";
import type { ExerciseLog } from "@/lib/firestore";
import type { Phase, SetDrawerConfig } from "@/types/session";

type ExerciseViewState = {
  exerciseIndex: number;
  setIndex: number;
  phase: Phase;
};

type Props = {
  ex: ExerciseLog;
  view: ExerciseViewState;
  drawerOpen: boolean;
  drawerConfig: SetDrawerConfig | null;
  onBack: () => void;
  onOpenDrawer: () => void;
  onTimerDone: () => void;
  onDrawerOpenChange: (open: boolean) => void;
  onConfirmSet: (weight: number, reps: number) => void;
};

export function ExerciseSetView({
  ex,
  view,
  drawerOpen,
  drawerConfig,
  onBack,
  onOpenDrawer,
  onTimerDone,
  onDrawerOpenChange,
  onConfirmSet,
}: Props) {
  const currentSet = ex.sets[view.setIndex];
  const previousSets = ex.sets
    .slice(0, view.setIndex)
    .filter((s) => s.loggedAt !== null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="mx-auto max-w-120 flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={onBack}
            aria-label="Back to exercises"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <p className="font-semibold truncate flex-1">{ex.exerciseName}</p>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-120 flex flex-col items-center justify-center px-6 py-8 gap-8">
        {view.phase === "active" ? (
          <>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Dumbbell className="h-5 w-5" />
              <span className="text-base">
                Set{" "}
                <span className="text-foreground font-bold text-lg">
                  {view.setIndex + 1}
                </span>{" "}
                of {ex.sets.length}
              </span>
            </div>

            {previousSets.length > 0 && (
              <div className="w-full space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider text-center">
                  Previous sets
                </p>
                {previousSets.map((s) => (
                  <div
                    key={s.setNumber}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
                  >
                    <span>Set {s.setNumber}</span>
                    <span>
                      {s.weight} kg × {s.reps} reps
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-background/95 backdrop-blur border-t border-border pb-[calc(16px+env(safe-area-inset-bottom))]">
              <div className="mx-auto max-w-120">
                <Button
                  className="w-full h-16 text-xl font-semibold gap-2"
                  onClick={onOpenDrawer}
                  disabled={!currentSet || currentSet.loggedAt !== null}
                >
                  Done
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Next: Set {view.setIndex + 2} of {ex.sets.length}
            </p>
            <RestTimer
              key={`${view.exerciseIndex}-${view.setIndex}`}
              onDone={onTimerDone}
            />
          </>
        )}
      </main>

      {drawerConfig && (
        <LogSetDrawer
          open={drawerOpen}
          onOpenChange={onDrawerOpenChange}
          {...drawerConfig}
          onConfirm={onConfirmSet}
        />
      )}
    </div>
  );
}
