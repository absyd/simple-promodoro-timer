# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

Simple Pomodoro Timer web app built with Next.js (App Router + TypeScript) and Tailwind CSS.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test framework is set up.

## Architecture

Single-page app — the entire timer lives on the root route (`/`).


- **`app/page.tsx`** — Renders the `PomodoroTimer` component
- **`app/components/PomodoroTimer.tsx`** — Client component with all timer logic: 25-min work → 5-min short break → 15-min long break (every 4 sessions). Uses `setInterval` wrapped in `useEffect` with state for mode, remaining time, and session trackin
- **`app/layout.tsx`** — Root layout with basic metadata and Tailwind styles

All styling uses Tailwind CSS utility classes on a dark theme (gray-950 background, rose-500 accent).
