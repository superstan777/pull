import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MOCK_PLAN } from "@/lib/mockPlan";

export type SetLog = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  loggedAt: Timestamp | null;
};

export type ExerciseLog = {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
};

export type Session = {
  id: string;
  planId: string;
  planName: string;
  startedAt: Timestamp;
  finishedAt: Timestamp | null;
  exercises: ExerciseLog[];
};

function buildInitialExercises(): ExerciseLog[] {
  return MOCK_PLAN.exercises.map((ex) => ({
    exerciseId: ex.id,
    exerciseName: ex.name,
    sets: Array.from({ length: ex.sets }, (_, i) => ({
      setNumber: i + 1,
      reps: null,
      weight: null,
      loggedAt: null,
    })),
  }));
}

export async function createSession(uid: string): Promise<string> {
  const sessionsRef = collection(db, "users", uid, "sessions");
  const docRef = await addDoc(sessionsRef, {
    planId: MOCK_PLAN.id,
    planName: MOCK_PLAN.name,
    startedAt: serverTimestamp(),
    finishedAt: null,
    exercises: buildInitialExercises(),
  });
  return docRef.id;
}

export async function getActiveSession(uid: string): Promise<Session | null> {
  const sessionsRef = collection(db, "users", uid, "sessions");
  const q = query(sessionsRef, orderBy("startedAt", "desc"));
  const snap = await getDocs(q);
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (!data.finishedAt) {
      return { id: docSnap.id, ...data } as Session;
    }
  }
  return null;
}

export function subscribeToSession(
  uid: string,
  sessionId: string,
  onData: (session: Session) => void,
  onError?: (err: Error) => void,
) {
  const docRef = doc(db, "users", uid, "sessions", sessionId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData({ id: snap.id, ...snap.data() } as Session);
      }
    },
    onError,
  );
}

export async function logSet(
  uid: string,
  sessionId: string,
  exerciseIndex: number,
  setIndex: number,
  weight: number | null,
  reps: number | null,
  currentExercises: ExerciseLog[],
) {
  const updatedExercises = currentExercises.map((ex, ei) => {
    if (ei !== exerciseIndex) return ex;
    return {
      ...ex,
      sets: ex.sets.map((s, si) => {
        if (si !== setIndex) return s;
        return {
          ...s,
          weight,
          reps,
          loggedAt: Timestamp.now(),
        };
      }),
    };
  });

  const docRef = doc(db, "users", uid, "sessions", sessionId);
  await updateDoc(docRef, { exercises: updatedExercises });
  return updatedExercises;
}

export async function finishSession(uid: string, sessionId: string) {
  const docRef = doc(db, "users", uid, "sessions", sessionId);
  await updateDoc(docRef, { finishedAt: serverTimestamp() });
}

export async function getSession(
  uid: string,
  sessionId: string,
): Promise<Session | null> {
  const docRef = doc(db, "users", uid, "sessions", sessionId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Session;
}

export async function getSessions(uid: string): Promise<Session[]> {
  const sessionsRef = collection(db, "users", uid, "sessions");
  const q = query(sessionsRef, orderBy("startedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
}
