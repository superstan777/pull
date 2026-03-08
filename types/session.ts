export type Phase = "active" | "resting";

export type ViewState =
  | { type: "list" }
  | { type: "exercise"; exerciseIndex: number; setIndex: number; phase: Phase };

export type SetDrawerConfig = {
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  defaultWeight: number;
  defaultReps: number;
};
