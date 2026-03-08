"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { useSession } from "@/hooks/useSession";
import { logSet, finishSession } from "@/lib/firestore";
import type { ExerciseLog } from "@/lib/firestore";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { ExerciseListView } from "@/components/ExerciseListView";
import { ExerciseSetView } from "@/components/ExerciseSetView";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { ViewState, SetDrawerConfig } from "@/types/session";

// ─── helpers ────────────────────────────────────────────────────────────────

function fakeTimestamp(): Timestamp {
  return { toDate: () => new Date() } as unknown as Timestamp;
}

// ─── main component ─────────────────────────────────────────────────────────

function SessionContent({ sessionId }: { sessionId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { session, loading } = useSession(user?.uid ?? null, sessionId);

  const [view, setView] = useState<ViewState>({ type: "list" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localExercises, setLocalExercises] = useState<ExerciseLog[] | null>(
    null,
  );
  const [lastWeight, setLastWeight] = useState<Record<number, number>>({});
  const [lastReps, setLastReps] = useState<Record<number, number>>({});
  const [finishing, setFinishing] = useState(false);

  const exercises = localExercises ?? session?.exercises ?? [];

  const totalSets = exercises.reduce((a, ex) => a + ex.sets.length, 0);
  const loggedSets = exercises.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.loggedAt !== null).length,
    0,
  );
  const allDone = totalSets > 0 && loggedSets === totalSets;

  // Called when user confirms values in the drawer
  const handleConfirmSet = useCallback(
    async (weight: number, reps: number) => {
      if (!user || !session || view.type !== "exercise") return;

      const { exerciseIndex, setIndex } = view;
      const current = localExercises ?? session.exercises;
      const ex = current[exerciseIndex];
      const isLastSet = setIndex === ex.sets.length - 1;

      // Optimistic update
      const updated = current.map((e, ei) => {
        if (ei !== exerciseIndex) return e;
        return {
          ...e,
          sets: e.sets.map((s, si) => {
            if (si !== setIndex) return s;
            return { ...s, weight, reps, loggedAt: fakeTimestamp() };
          }),
        };
      });
      setLocalExercises(updated);
      setLastWeight((p) => ({ ...p, [exerciseIndex]: weight }));
      setLastReps((p) => ({ ...p, [exerciseIndex]: reps }));

      setDrawerOpen(false);

      if (isLastSet) {
        // All sets for this exercise done → back to list
        setView({ type: "list" });
        toast.success("Exercise done!", { position: "top-center" });
      } else {
        // More sets → show rest timer
        setView({
          type: "exercise",
          exerciseIndex,
          setIndex,
          phase: "resting",
        });
      }

      // Background Firestore write
      try {
        await logSet(
          user.uid,
          sessionId,
          exerciseIndex,
          setIndex,
          weight,
          reps,
          current,
        );
      } catch {
        toast.error("Failed to save set", { position: "top-center" });
        setLocalExercises(current);
      }
    },
    [user, session, view, localExercises, sessionId],
  );

  const handleTimerDone = useCallback(() => {
    if (view.type !== "exercise") return;
    setView({
      type: "exercise",
      exerciseIndex: view.exerciseIndex,
      setIndex: view.setIndex + 1,
      phase: "active",
    });
  }, [view]);

  async function handleFinish() {
    if (!user) return;
    setFinishing(true);
    try {
      await finishSession(user.uid, sessionId);
      toast.success("Workout finished!", { position: "top-center" });
      router.replace(`/history/${sessionId}`);
    } catch {
      toast.error("Failed to finish workout", { position: "top-center" });
      setFinishing(false);
    }
  }

  // ─── loading / error ───────────────────────────────────────────────────────

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Session not found.
      </div>
    );
  }

  // ─── render ───────────────────────────────────────────────────────────────

  const drawerConfig: SetDrawerConfig | null =
    view.type === "exercise"
      ? {
          exerciseName: exercises[view.exerciseIndex]?.exerciseName ?? "",
          setNumber: view.setIndex + 1,
          totalSets: exercises[view.exerciseIndex]?.sets.length ?? 1,
          defaultWeight: lastWeight[view.exerciseIndex] ?? 60,
          defaultReps: lastReps[view.exerciseIndex] ?? 10,
        }
      : null;

  if (view.type === "list") {
    return (
      <ExerciseListView
        session={session}
        exercises={exercises}
        loggedSets={loggedSets}
        totalSets={totalSets}
        allDone={allDone}
        finishing={finishing}
        onSelectExercise={(exerciseIndex, setIndex) =>
          setView({
            type: "exercise",
            exerciseIndex,
            setIndex,
            phase: "active",
          })
        }
        onFinish={handleFinish}
      />
    );
  }

  return (
    <ExerciseSetView
      ex={exercises[view.exerciseIndex]}
      view={view}
      drawerOpen={drawerOpen}
      drawerConfig={drawerConfig}
      onBack={() => setView({ type: "list" })}
      onOpenDrawer={() => setDrawerOpen(true)}
      onTimerDone={handleTimerDone}
      onDrawerOpenChange={setDrawerOpen}
      onConfirmSet={handleConfirmSet}
    />
  );
}

// ─── page export ─────────────────────────────────────────────────────────────

export default function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  return (
    <AuthGuard>
      <SessionContent sessionId={sessionId} />
    </AuthGuard>
  );
}
