"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { getSession, Session } from "@/lib/firestore";
import { formatDate, formatDuration } from "@/lib/timeUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function SessionDetailContent({ sessionId }: { sessionId: string }) {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getSession(user.uid, sessionId)
      .then(setSession)
      .catch(() =>
        toast.error("Failed to load session", { position: "top-center" }),
      )
      .finally(() => setLoading(false));
  }, [user, sessionId]);

  const startDate = session?.startedAt?.toDate();
  const endDate = session?.finishedAt?.toDate();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-8">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="mx-auto max-w-120 flex items-center gap-3 px-4 h-14">
          <Link
            href="/history"
            className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            aria-label="Back to history"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-bold text-base truncate">
            {session?.planName ?? "Session"}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-120 px-4 py-4 space-y-4">
        {loading ? (
          <LoadingSpinner />
        ) : !session ? (
          <p className="text-center text-muted-foreground py-16">
            Session not found.
          </p>
        ) : (
          <>
            {/* Session meta */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{session.planName}</span>
                  {session.finishedAt ? (
                    <Badge variant="secondary">Finished</Badge>
                  ) : (
                    <Badge variant="default">In Progress</Badge>
                  )}
                </div>
                {startDate && (
                  <p className="text-sm text-muted-foreground">
                    Started: {formatDate(startDate)}
                  </p>
                )}
                {endDate && (
                  <p className="text-sm text-muted-foreground">
                    Finished: {formatDate(endDate)}
                  </p>
                )}
                {startDate && endDate && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(startDate, endDate)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Exercises */}
            {session.exercises.map((ex) => (
              <Card key={ex.exerciseId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold">
                    {ex.exerciseName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {ex.sets.map((s) => {
                    const logged = s.loggedAt !== null;
                    return (
                      <div
                        key={s.setNumber}
                        className={cn(
                          "flex items-center gap-3 py-2 px-1 rounded-lg",
                          logged ? "opacity-70" : "opacity-40",
                        )}
                      >
                        <span className="text-sm text-muted-foreground w-12 shrink-0">
                          Set {s.setNumber}
                        </span>
                        <span className="text-base flex-1">
                          {s.weight !== null ? `${s.weight} kg` : "—"}
                        </span>
                        <span className="text-base flex-1">
                          {s.reps !== null ? `${s.reps} reps` : "—"}
                        </span>
                        {logged && (
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                  <Separator className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  return (
    <AuthGuard>
      <SessionDetailContent sessionId={sessionId} />
    </AuthGuard>
  );
}
