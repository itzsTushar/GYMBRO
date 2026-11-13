# GYMBRO — Phase 1

A light-theme fitness dashboard built with plain HTML, CSS and vanilla JavaScript.

## Run
1. Extract the ZIP.
2. Open `index.html` in a modern browser.
3. No Node.js, build step, database or backend is required.

## Included in Phase 1
- Responsive left sidebar (mobile drawer on small screens)
- Dashboard cards
- Monthly calendar UI
- Last 30 days summary/history
- Streak calculation rules:
  - Monday–Friday: workout required; a missed day breaks the streak
  - Saturday: optional; completing adds to streak, skipping is neutral
  - Sunday: rest day; neutral
  - Today is not marked missed before the day ends
- LocalStorage helpers
- Reminder settings UI (browser notification limitations apply)
- History-only reset; exercise library/settings are preserved

## Next phases
Phase 2: dynamic exercise library.
Phase 3: daily workout planner and set-by-set progress.
Phase 4: connect real completed workouts to calendar and streak records.

Note: Phase 1 has no sample workout records, so streak and workout totals start at zero. The exercise/workout pages are placeholders until their respective phases.
