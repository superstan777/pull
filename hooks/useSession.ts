"use client";

import { useEffect, useState } from "react";
import { Session, subscribeToSession } from "@/lib/firestore";

export function useSession(uid: string | null, sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !sessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToSession(
      uid,
      sessionId,
      (s) => {
        setSession(s);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, [uid, sessionId]);

  return { session, loading };
}
