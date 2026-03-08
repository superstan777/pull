# Pull — Training Notes

A phone-first workout logging app built with **Next.js**, **shadcn/ui**, and **Firebase**.

Log your sets between reps — weight, reps, done.

---

## Features

- SMS phone authentication (Firebase Phone Auth)
- Start, continue, and finish workout sessions
- Log sets per exercise with weight + reps
- Optimistic UI — feels instant, syncs in background
- Full session history
- Dark mode by default, mobile-first design

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project.
2. Enable **Phone Authentication**: Authentication → Sign-in method → Phone.
3. Enable **Firestore Database** in production mode.
4. Add Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

5. Copy your Firebase config to `.env.local` (use `.env.local.example` as a template):

```bash
cp .env.local.example .env.local
```

Then fill in your Firebase values.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy

Deploy to [Vercel](https://vercel.com) — connect the repo and add your `.env.local` values as environment variables in the Vercel project settings.

---

## Routes

| Route                  | Description                        |
| ---------------------- | ---------------------------------- |
| `/login`               | Phone + OTP authentication         |
| `/`                    | Home — start or continue a workout |
| `/session/[sessionId]` | Active workout logging             |
| `/history`             | Past sessions list                 |
| `/history/[sessionId]` | Read-only session detail           |
# pull
