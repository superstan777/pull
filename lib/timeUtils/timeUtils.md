# timeUtils

## Purpose

Formatting helpers for dates and durations displayed in the history view.

## API

- `formatDate(date)`: returns a human-readable string like "Sat, Mar 7, 2026, 9:41 AM" using `en-US` locale
- `formatDuration(start, end)`: returns `"Xh Ym"` or `"Ym"` (hours omitted when < 1h); rounds down to whole minutes

## Used by

- `components/SessionSummary/SessionSummary.tsx`
