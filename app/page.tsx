"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, LogOut, Clock, ArrowRight, History } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { createSession, getActiveSession, Session } from "@/lib/firestore";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { formatDate } from "@/lib/timeUtils";

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user) return;
    getActiveSession(user.uid)
      .then(setActiveSession)
      .catch(() => toast.error("Failed to load session"))
      .finally(() => setLoadingSession(false));
  }, [user]);

  async function handleStartWorkout() {
    if (!user) return;
    setStarting(true);
    try {
      const id = await createSession(user.uid);
      router.push(`/session/${id}`);
    } catch {
      toast.error("Failed to start workout");
      setStarting(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/login");
    } catch {
      toast.error("Sign out failed");
    }
  }

  const totalSets =
    activeSession?.exercises.reduce((a, ex) => a + ex.sets.length, 0) ?? 0;
  const loggedSets =
    activeSession?.exercises.reduce(
      (a, ex) => a + ex.sets.filter((s) => s.loggedAt !== null).length,
      0,
    ) ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="mx-auto max-w-120 flex items-center justify-between px-4 h-14">
          <span className="font-bold text-lg">Pull</span>
          <div className="flex items-center gap-2">
            {user?.phoneNumber && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {user.phoneNumber}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-120 px-4 py-6 space-y-6">
        {loadingSession ? (
          <div className="space-y-3">
            <div className="h-28 rounded-xl bg-muted animate-pulse" />
          </div>
        ) : activeSession ? (
          <Card className="border-primary/40">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Dumbbell className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold">{activeSession.planName}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {activeSession.startedAt &&
                        formatDate(activeSession.startedAt.toDate())}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {loggedSets}/{totalSets} sets logged
                  </p>
                </div>
              </div>
              <Separator />
              <Button
                className="w-full h-12 text-base gap-2"
                onClick={() => router.push(`/session/${activeSession.id}`)}
              >
                Continue Workout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button
            className="w-full h-14 text-lg gap-2"
            onClick={handleStartWorkout}
            disabled={starting}
          >
            <Dumbbell className="h-5 w-5" />
            {starting ? "Starting…" : "Start Workout"}
          </Button>
        )}

        <div className="text-center">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="h-4 w-4" />
            View History
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}
