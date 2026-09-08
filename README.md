# Japanese N1 Immersive Sparring Partner

A calm, reading-first JLPT N1 daily learning dashboard built with React, TypeScript and Vite.

## First version

The current UI turns a daily N1 practice message into a reusable learning flow:

- Daily dashboard with progress and study route
- Immersive reading with **Japanese only / bilingual / analysis** modes
- N1 vocabulary cards with collocations, nuance and examples
- N1 grammar cards with register, form, frequency and comparisons
- JLPT-style reading comprehension with answer explanations
- Automatic review list for items marked “需要复习” and incorrect reading answers
- Learning history and lightweight progress overview
- Light / dark reading themes
- Responsive desktop and mobile layouts
- Local persistence via `localStorage` (no backend required for v1)

## Design principles

This project is optimized for longer reading sessions rather than high-density dashboard visuals:

- low-saturation neutral backgrounds
- restrained indigo / teal accents
- high-contrast but soft text colors
- generous Japanese line-height
- serif Japanese reading surface, sans-serif UI chrome
- minimal shadows and borders
- reduced-motion support
- keyboard focus states

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Content structure

Daily lesson content is currently defined in:

```text
src/data/lesson.ts
```

The data is separated from the UI so future daily pushes can be exported into the same structure without rewriting components.

A next iteration can move from one lesson module to date-based JSON/TS files, for example:

```text
src/data/lessons/
  2026-09-09.json
  2026-09-10.json
  2026-09-11.json
```

## Future roadmap

1. Date-based lesson loader and full calendar
2. Search across vocabulary / grammar / past lessons
3. Spaced-repetition scheduler (1 → 3 → 7 → 14 → 30 days)
4. Supabase sync for progress across devices
5. Daily content import pipeline shared with the ChatGPT push format
6. Audio / shadowing mode for selected passages

## Tech stack

- React
- TypeScript
- Vite
- Plain CSS design system
- Browser `localStorage`
