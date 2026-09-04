# Optimus UI Design

A visual theme editor and open marketplace for [Optimus UI](https://www.openng.org/) —
the MIT-licensed continuation of PrimeNG. Build a theme by editing design tokens against a
live preview, export a typed preset, or publish it to the community marketplace so anyone
can browse it, fork it, and trace its lineage.

## What it does

- **Visual token editor** (`/designer`) — primitive palettes, border radii, semantic roles,
  component tokens, custom tokens, and typography, with a live Optimus UI preview and
  complete sample screens.
- **Official starting points** — begin from Aura, Material, Lara, or Nora, or from the
  bundled shadcn / Bootstrap / Material starter themes.
- **Flexible import** — restore a base64 token, raw theme JSON, a downloaded `.ts` preset
  file, or a shared `?theme=` / `?themeId=` URL.
- **Typed export** — download the theme as a `TypeScript` preset (`export default … as const`).
- **Open marketplace** (`/`) — sign in with GitHub, publish your theme, and browse everyone
  else's. Search, sort, and filter by foundation.
- **Fork lineage** — every published theme can be forked into the designer; the marketplace
  records the parent link and renders the full family tree at `/theme/:id`.
- **Moderation** — a report button on every theme plus an admin takedown queue (`/admin`);
  themes auto-hide once they collect enough distinct reports.
- **Light / dark** — a single app-wide toggle in the shared header.

## Architecture

| Part | Stack |
| --- | --- |
| Frontend | Angular 21 standalone components + signals, `@openng/optimus-ui` (v1), Tailwind CSS 4, Chart.js, Vitest |
| Backend | FastAPI + SQLite + SQLAlchemy, GitHub OAuth (bearer-token), slowapi rate limiting |
| Delivery | One Docker image — the Angular build is served by the FastAPI process |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Theme marketplace (home) |
| `/theme/:id` | Theme detail + fork lineage tree |
| `/designer` | Visual token editor, import, share, export, publish |
| `/admin` | Moderator report queue (admins only) |
| `/auth/callback` | GitHub OAuth landing route |

## Local development

Requirements: Node.js `^20.19 || ^22.12 || >=24`, npm 11, Python 3.12.

```bash
# frontend
npm install
npm start                     # http://localhost:4200

# backend (separate terminal)
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # add a GitHub OAuth app + SESSION_SECRET
uvicorn app.main:app --reload  # http://localhost:8000/docs
```

`src/environments/environment.ts` already points `apiUrl` at `http://localhost:8000`.

### Make shortcuts

```bash
make setup       # install frontend and backend dependencies
make dev         # run the Angular app and API together (with local sign-in)
make test        # run both test suites
make build       # build the production frontend bundle
```

Use `make help` to see the individual frontend and API commands. `make dev` signs in as a local
development account, so it does not need GitHub OAuth. Add `backend/.env` from
`backend/.env.example` when you want to test GitHub sign-in itself.

### Verification

```bash
npm test -- --watch=false     # Angular / Vitest
npm run build
cd backend && pytest
```

## Docker

`Dockerfile` builds a single image: a Node stage compiles the SPA, then a Python stage runs
`uvicorn` and serves both `/api/*` and the static app (`STATIC_DIR=/app/static`).

```bash
docker build -t optimus-ui-design .
docker run --rm -p 8000:8000 \
  -e SESSION_SECRET=dev -e GITHUB_CLIENT_ID=… -e GITHUB_CLIENT_SECRET=… \
  -e FRONTEND_URL=http://localhost:8000 -e FRONTEND_ORIGINS=http://localhost:8000 \
  optimus-ui-design
```

## Project structure

```text
src/app/
├── core/                 # shared header, auth, theme-mode, marketplace API client
├── features/
│   ├── gallery/          # marketplace, theme detail + lineage, report + admin
│   ├── designer/         # visual token editor, import/share/export, publish dialog
│   └── auth-callback/    # GitHub OAuth return
├── app.routes.ts
└── theme-presets.ts
backend/app/              # FastAPI: models, schemas, routers (auth / themes / admin)
```

## Attribution

Portions of the sample data and assets are adapted from
[openng-org/optimus-ui](https://github.com/openng-org/optimus-ui) (MIT). See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Not affiliated with or endorsed by OpenNG or the Optimus UI maintainers.
