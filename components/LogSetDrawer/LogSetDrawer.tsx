"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollPicker } from "@/components/ScrollPicker";

// Build kg options: 0 to 200 step 0.5
const KG_ITEMS: string[] = [];
for (let kg = 0; kg <= 200; kg += 0.5) {
  KG_ITEMS.push(Number.isInteger(kg) ? `${kg}` : kg.toFixed(1));
}

// Build reps options: 1 to 50
const REPS_ITEMS: string[] = Array.from({ length: 50 }, (_, i) =>
  String(i + 1),
);

interface LogSetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  defaultWeight: number;
  defaultReps: number;
  onConfirm: (weight: number, reps: number) => void;
}

export function LogSetDrawer({
  open,
  onOpenChange,
  exerciseName,
  setNumber,
  totalSets,
  defaultWeight,
  defaultReps,
  onConfirm,
}: LogSetDrawerProps) {
  const [weight, setWeight] = useState<string>(() => {
    const idx = KG_ITEMS.findIndex((k) => parseFloat(k) === defaultWeight);
    return idx >= 0 ? KG_ITEMS[idx] : "60";
  });

  const [reps, setReps] = useState<string>(() => {
    const val = String(Math.max(1, Math.min(50, defaultReps)));
    return REPS_ITEMS.includes(val) ? val : "10";
  });

  function handleConfirm() {
    onConfirm(parseFloat(weight), parseInt(reps));
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-120 pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center text-base font-semibold">
            {exerciseName}
          </DrawerTitle>
          <p className="text-center text-sm text-muted-foreground mt-0.5">
            Set {setNumber} of {totalSets}
          </p>
        </DrawerHeader>

        {/* Pickers */}
        <div className="flex items-stretch gap-4 px-6 py-2">
          <ScrollPicker
            items={KG_ITEMS}
            value={weight}
            onChange={setWeight}
            label="kg"
          />
          <div className="w-px bg-border self-stretch my-4" />
          <ScrollPicker
            items={REPS_ITEMS}
            value={reps}
            onChange={setReps}
            label="reps"
          />
        </div>

        {/* Confirm */}
        <div className="px-6 pb-6 pt-4">
          <Button className="w-full h-14 text-lg" onClick={handleConfirm}>
            Save — {weight} kg × {reps} reps
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
