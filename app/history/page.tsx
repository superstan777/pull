"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getSessions, Session } from "@/lib/firestore";
import { formatDate, formatDuration } from "@/lib/timeUtils";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

function HistoryContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getSessions(user.uid)
      .then(setSessions)
      .catch(() =>
        toast.error("Failed to load history", { position: "top-center" }),
      )
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="mx-auto max-w-120 flex items-center px-4 h-14">
          <span className="font-bold text-lg">History</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-120 px-4 py-4">
        {loading ? (
          <LoadingSpinner />
        ) : sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-base">No sessions yet.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-2 text-sm underline underline-offset-2"
            >
              Start your first workout
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const totalSets = s.exercises.reduce(
                (a, ex) => a + ex.sets.length,
                0,
              );
              const loggedSets = s.exercises.reduce(
                (a, ex) =>
                  a + ex.sets.filter((set) => set.loggedAt !== null).length,
                0,
              );
              const startDate = s.startedAt?.toDate();
              const endDate = s.finishedAt?.toDate();

              return (
                <li key={s.id}>
                  <Link
                    href={`/history/${s.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">
                          {s.planName}
                        </span>
                        {s.finishedAt ? (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            Done
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs shrink-0">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {startDate && formatDate(startDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {loggedSets}/{totalSets} sets
                        {endDate && startDate && (
                          <> · {formatDuration(startDate, endDate)}</>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryContent />
    </AuthGuard>
  );
}
