"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetRow } from "@/components/SetRow";
import { ExerciseLog } from "@/lib/firestore";

interface ExerciseCardProps {
  exercise: ExerciseLog;
  exerciseIndex: number;
  onLog: (
    exerciseIndex: number,
    setIndex: number,
    weight: number | null,
    reps: number | null,
  ) => Promise<void>;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  onLog,
}: ExerciseCardProps) {
  const totalSets = exercise.sets.length;
  const loggedSets = exercise.sets.filter((s) => s.loggedAt !== null).length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">
            {exercise.exerciseName}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {loggedSets}/{totalSets}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {exercise.sets.map((set, si) => (
          <SetRow
            key={si}
            set={set}
            exerciseIndex={exerciseIndex}
            setIndex={si}
            onLog={onLog}
          />
        ))}
      </CardContent>
    </Card>
  );
}
