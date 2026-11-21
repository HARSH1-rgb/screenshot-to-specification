# TalentLens — AI Interview Preparation

TalentLens helps students, fresh graduates and job seekers practise adaptive AI mock interviews, get scored feedback, and follow a personal learning roadmap.

## Pages

| Path | What it does |
| --- | --- |
| `/` | Introduction, features and start button |
| `/setup` | Job role, experience level, interview type, difficulty, question count |
| `/interview` | Adaptive questions, answer box, progress, timer, optional voice (read aloud + dictation) |
| `/report` and `/report/:id` | Saved reports: scores, strengths, weaknesses, feedback, learning roadmap |
| `/coach` | IQ Coach chatbot (one ongoing chat, saved in this browser) |
| `/resume` | Resume vs. job description match (nothing is stored) |

## AI endpoints (server-side only)

All AI calls run on the server through Lovable AI using a Gemini model. The browser never sees a key.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/interview` | Next adaptive question from role, level, history and latest answer |
| `POST /api/evaluate` | Scores (correctness, relevance, clarity, depth, communication), strengths, weaknesses, feedback |
| `POST /api/report` | Final report + roadmap as JSON (overall and category scores computed in code) |
| `POST /api/coach` | Streaming IQ Coach chat |
| `POST /api/resume` | Matching / missing skills and improvements |

Every request and response is validated with Zod (`src/lib/interview/schemas.ts`). Prompts live in `src/lib/ai/prompts.server.ts`.

## Storage & privacy

- No login and no database.
- The active interview lives in React state; finished reports and the coach chat are saved in `localStorage`.
- Resume text is only used for the single comparison request and is never stored.

## Configuration

`LOVABLE_API_KEY` is provided automatically on Lovable. If it is missing, the site still loads and every AI feature shows a friendly "AI isn't configured yet" message. See `.env.example`.

## Development

```bash
bun install
bun run dev    # http://localhost:8080
bun run test   # scoring and routing tests
```

Built with TanStack Start (React + Vite), Tailwind CSS v4 and the Vercel AI SDK.
