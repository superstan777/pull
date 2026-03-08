# RestTimer

## Purpose

Full-screen 90-second rest countdown with a circular SVG progress arc, shown between sets.

## Props / API

- `onDone`: called when the countdown reaches zero (after 400ms grace pause) or when "Skip Rest" is tapped
- `key` (React): parent passes `exerciseIndex-setIndex` as the key so the timer fully remounts and resets on each new set

## Behaviour

- `DURATION = 90` seconds — fixed, no configuration
- SVG circle rotated −90° so the arc starts from the 12 o'clock position; `strokeDashoffset` drives progress
- `onDone` fires 400ms after reaching zero so the user briefly sees "0:00" before the screen advances — avoids a jarring instant transition
- Skipping calls `onDone` immediately, bypassing the 400ms delay
- Timer starts automatically on mount; interval is cleaned up on unmount

## Used by

- `app/session/[sessionId]/page.tsx`
