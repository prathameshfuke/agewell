# .github/workflows

`ci.yml` ("CI/CD") runs on every pull request and on push to `main`.

| Job | What |
|---|---|
| `frontend` | Node 22, `npm ci`, `npm test --if-present`, `npm run build` in `frontend/`. |
| `backend` | Python 3.12, install requirements, `compileall`, `python test_auth.py`. |
| `deploy-frontend` | After both pass: `vercel pull/build/deploy --prebuilt`; PRs get a preview, `main` goes `--prod`. Skips if `VERCEL_TOKEN` unset. |
| `deploy-backend` | `main` only: POSTs `RENDER_DEPLOY_HOOK_URL`. Skips if unset. |

Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RENDER_DEPLOY_HOOK_URL`.

Gotchas: a skipped deploy step still shows green. Fork PRs have no secrets. DB migrations are not applied by CI.
