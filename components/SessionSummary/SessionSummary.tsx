import { Session } from "@/lib/firestore";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatDate } from "@/lib/timeUtils";

interface SessionSummaryProps {
  session: Session;
}

export function SessionSummary({ session }: SessionSummaryProps) {
  const totalSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0,
  );
  const loggedSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.loggedAt !== null).length,
    0,
  );

  const startDate = session.startedAt?.toDate();
  const endDate = session.finishedAt?.toDate();

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold">{session.planName}</span>
        {session.finishedAt ? (
          <Badge variant="secondary">Finished</Badge>
        ) : (
          <Badge variant="default">In Progress</Badge>
        )}
      </div>
      <div className="text-sm text-muted-foreground space-y-0.5">
        {startDate && <p>{formatDate(startDate)}</p>}
        {endDate && startDate && (
          <p>Duration: {formatDuration(startDate, endDate)}</p>
        )}
        <p>
          {loggedSets}/{totalSets} sets logged
        </p>
      </div>
    </div>
  );
}
