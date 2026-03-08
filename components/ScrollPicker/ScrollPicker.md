# ScrollPicker

## Purpose

Snap-scroll value picker for numbers/labels; the foundational input primitive for the gym logging UI.

## Props / API

- `items`: ordered list of string values to scroll through
- `value`: currently selected value (controlled)
- `onChange`: fires once the user stops scrolling and the list snaps (debounced 80ms)
- `label`: optional uppercase header shown above the picker (e.g. "kg", "reps")

## Behaviour

- `ITEM_H = 44px`, `VISIBLE = 5` items → container height 220px; top/bottom padding of 88px lets first and last items centre in the window
- Scroll-snap is mandatory y-axis — browser enforces snapping; the 80ms debounce fires `onChange` only after snap settles
- Selection highlight band (muted background) is placed in the DOM **before** the scroll container so item text renders on top via natural stacking order — no `z-index` needed
- `busy` ref blocks external `value` sync while the user is actively scrolling; cleared 60ms after snap resolves to absorb momentum
- `useLayoutEffect` sets initial `scrollTop` synchronously (no animation flicker on mount)
- Fade gradients reference CSS `--background` so they stay correct in dark mode without hardcoded colours
- Items dim by distance from centre: selected `opacity-100`, ±1 `opacity-40`, further `opacity-15`

## Used by

- `components/LogSetDrawer.tsx`
