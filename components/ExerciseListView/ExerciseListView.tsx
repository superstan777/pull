"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import type { ExerciseLog, Session } from "@/lib/firestore";
import { cn } from "@/lib/utils";

function firstIncompleteSet(ex: ExerciseLog): number {
  const idx = ex.sets.findIndex((s) => s.loggedAt === null);
  return idx === -1 ? ex.sets.length : idx;
}

type Props = {
  session: Session;
  exercises: ExerciseLog[];
  loggedSets: number;
  totalSets: number;
  allDone: boolean;
  finishing: boolean;
  onSelectExercise: (exerciseIndex: number, setIndex: number) => void;
  onFinish: () => void;
};

export function ExerciseListView({
  session,
  exercises,
  loggedSets,
  totalSets,
  allDone,
  finishing,
  onSelectExercise,
  onFinish,
}: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-32">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="mx-auto max-w-120 flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => router.push("/")}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{session.planName}</p>
            <p className="text-xs text-muted-foreground">
              {loggedSets}/{totalSets} sets
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-120 px-4 py-4 space-y-2">
        {exercises.map((ex, i) => {
          const done = ex.sets.every((s) => s.loggedAt !== null);
          const nextSet = firstIncompleteSet(ex);

          return (
            <button
              key={ex.exerciseId}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 text-left transition-colors",
                done
                  ? "opacity-50"
                  : "hover:bg-accent active:bg-accent cursor-pointer",
              )}
              onClick={() => {
                if (done) return;
                onSelectExercise(i, firstIncompleteSet(ex));
              }}
              disabled={done}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">
                  {ex.exerciseName}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {done
                    ? "Done"
                    : nextSet === 0
                      ? `${ex.sets.length} sets`
                      : `Set ${nextSet + 1} of ${ex.sets.length}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {ex.sets.filter((s) => s.loggedAt !== null).length}/
                      {ex.sets.length}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </div>
            </button>
          );
        })}
      </main>

      {allDone && (
        <div className="fixed bottom-16 left-0 right-0 z-50 px-4 py-3 bg-background/95 backdrop-blur border-t border-border pb-[calc(12px+env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-120">
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={onFinish}
              disabled={finishing}
            >
              <CheckCircle2 className="h-5 w-5" />
              {finishing ? "Finishing…" : "Finish Workout"}
            </Button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
