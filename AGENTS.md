<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## TalentLens architecture

- AI calls live only in server routes under `src/routes/api/*` using helpers in `src/lib/ai/*.server.ts`; the browser calls them via `src/lib/api.ts`. Why: keeps the AI key and prompts server-side.
- Request/response contracts are Zod schemas in `src/lib/interview/schemas.ts`, validated on both server and client before rendering. Why: model output can be malformed.
- Numeric scores (answer overall, session score, readiness) are computed in `src/lib/interview/scoring.ts`, never by the model. Why: deterministic, testable scoring.
- No database or login: active interview is React state, reports and coach chat go to localStorage via `src/lib/storage.ts`. Why: privacy requirement of the product.
