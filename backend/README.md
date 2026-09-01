# Theme Studio Marketplace API

FastAPI + SQLite backend that powers the open theme marketplace: publishing
themes, browsing the gallery, GitHub sign-in, and report/takedown moderation.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | – | Liveness probe |
| `GET` | `/api/auth/github/login?redirect=` | – | Start GitHub OAuth |
| `GET` | `/api/auth/github/callback` | – | OAuth callback → redirects to `<FRONTEND_URL>/auth/callback#token=…&next=…` |
| `GET` | `/api/auth/me` | Bearer | Current user |
| `POST` | `/api/auth/logout` | – | No-op (tokens are stateless) |
| `GET` | `/api/themes` | – | List (`sort=recent\|popular`, `base`, `search`, `limit`, `offset`) |
| `GET` | `/api/themes/{id}` | – | Single theme (bumps `view_count`) |
| `POST` | `/api/themes` | Bearer | Publish (5/min, quota `USER_THEME_QUOTA`, preset ≤ `MAX_PRESET_BYTES`) |
| `PATCH` | `/api/themes/{id}` | owner/admin | Update |
| `DELETE` | `/api/themes/{id}` | owner/admin | Delete |
| `POST` | `/api/themes/{id}/report` | Bearer | Report (5/min, one per user; auto-hides at `AUTO_HIDE_REPORT_THRESHOLD`) |
| `GET` | `/api/admin/reports?resolved=false` | admin | Moderation queue |
| `POST` | `/api/admin/reports/{id}/resolve` | admin | `{action: dismiss\|hide\|delete}` |
| `POST` | `/api/admin/themes/{id}/visibility` | admin | `{is_hidden: bool}` |

Auth uses a **Bearer token** (30-day HS256 JWT) returned in the callback URL
fragment, because the SPA and API run on different origins. The frontend stores
it in `localStorage` and sends it as `Authorization: Bearer <token>`.

## Local development

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in the GitHub OAuth app credentials + SESSION_SECRET
uvicorn app.main:app --reload  # http://localhost:8000/docs
pytest
```

### GitHub OAuth app

Create one at <https://github.com/settings/developers>:

- **Homepage URL:** `http://localhost:4200`
- **Authorization callback URL:** `http://localhost:8000/api/auth/github/callback`

Put the client id/secret in `.env`. Add your own GitHub login to
`ADMIN_GITHUB_LOGINS` to get the moderation panel.

## Configuration

All settings come from environment variables / `.env` — see
[`.env.example`](.env.example) for the full list and defaults.

## Notes

- The repo root `Dockerfile` bundles this API together with the compiled SPA into
  one image (`STATIC_DIR` makes the API serve the static app).
- **Persistence:** `DATABASE_URL` defaults to a local SQLite file. On a host with an
  ephemeral filesystem, point it at a mounted volume
  (`DATABASE_URL=sqlite:////data/themes.db`).
- Schema is created on startup (`Base.metadata.create_all`) and additive columns are
  patched in automatically (`_ensure_columns`); there is no Alembic yet.
- Set `FRONTEND_URL` / `FRONTEND_ORIGINS` to the deployed origin and
  `OAUTH_CALLBACK_URL` to `<origin>/api/auth/github/callback`, mirrored in the GitHub
  OAuth app.
