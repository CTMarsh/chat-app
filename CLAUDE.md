# Chat-App (chat web app) — Project Rules

Estate-wide rules: ../../CLAUDE.md (GitLab MR flow, never merge, ArgoCD-only cluster writes). Code-level rules: `chat-app/CLAUDE.md`. History: `chat-app/docs/history/`.

| Fact | Value |
|---|---|
| GitLab | homelab/chat-app, **ID 39**, default `main`, remote `gitlab`. **Git root is this directory** (`Chat-Web-Application/Chat-App/.git`); the app is in `chat-app/` |
| GitHub mirror | GitLab push mirror → GitHub `CTMarsh/Chat-App` (auto on push). The GitHub PAT lives in GitLab mirror settings — never copy it anywhere. Never push to GitHub directly |
| URL | https://chat.noahsark.me — namespace `chat-app`, ArgoCD-managed |
| Stack | Next.js 16.x App Router (`next` 16.3.6 on main), React 19.2.3, TS 5, `@supabase/supabase-js` 2.93, `@supabase/ssr` 0.8, Tailwind 4, Radix, `@noahsark/constellation ^0.2.0`, vitest |
| Image | `gitlab.noahsark.me:5050/homelab/chat-app/chat-app`. Dockerfile: **Node 22.23.4** (Node2Shell fix, chat !36), standalone output, port 3000, **npm/npx stripped from the runtime image** |
| Backend | Self-hosted Supabase on k3s (namespace `supabase`, https://supabase.noahsark.me) on CNPG `cockpit-pg`. Supabase Cloud projects `xtnqdyjldgmfhtvtggmm` / `bcwfsqldmyyrstxjuruc` are **legacy — never use** |
| Push | `/api/push-notify` → Notify (notify.noahsark.me) |
| Env | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTIFY_URL`, `NOTIFY_API_KEY` — from Vault via ESO, never committed |
| CI | SAST + Secret-Detection templates; `lint` (tsc) → `test:unit` → `build` (Kaniko, `--build-arg NPM_TOKEN=$CI_JOB_TOKEN` for the constellation package) → `trivy:scan` → `deploy:k8s` (MR to k8s-manifests `apps/chat-app/deployment.yaml`, `chat-app-deploy` token via `GITLAB_MANIFEST_PAT`, assignee 7 / reviewer 1) → `create-isc-release` → notify (allow_failure) |
| Deploy state | Check the estate dashboard. 2026-10-23: held at the Trivy gate by unrelated Next.js CVEs |

## CI guardrails

- **`test:unit` is BLOCKING — never `allow_failure`.** It pins the SSRF guard on `/api/link-preview` and the per-IP rate limiter + widget authz on the unauthenticated `/api/widget/*` routes.
- **`trivy:scan` has no `allow_failure`, and `deploy:k8s` `needs` it** — without that `needs` the scan is decorative. Keep both.
- Do not reinstall npm in the runtime image: npm vendors its own node-tar (CVE-2026-59873) that we cannot pin; Next standalone runs `node server.js` and needs no npm.
- Node pin is a security floor: never float back below 22.23.4.

## Chat cross-project rules (web ↔ ChatArk iOS, homelab/chatark ID 40, `D:\ClaudeProjects\Chat-App-Clients\ChatArk`)

- **Feature parity:** both clients MUST have the same feature set.
- **UI/styling parity:** both use **Constellation**. The old NauticalTheme (`#4A8BC2` / `#1A2938` / `#D4A04A`) is retired — never reintroduce it. Login is the canonical AuthShell, pixel-identical with photovault/mixvault (spec: `../../mixvault/CLAUDE.md`).
- **Backend changes require both clients updated** — any schema / RPC / Edge Function change affects both.
- **Security #1:** never weaken RLS policies, never bypass MFA, always validate server-side.
- **Dev is source of truth** — production Supabase MUST match Dev (today both point at the same self-hosted instance).
- **Shared RPCs — never rename or remove:** `get_allow_signups`, `upsert_user_session`, `revoke_user_session`, `revoke_other_sessions`, `admin_get_dashboard_metrics`, `admin_update_setting`, `pin_message` / `unpin_message`.
- **RLS helpers — never rename or remove:** `is_conversation_participant()`, `is_workspace_member()`, `is_workspace_admin()`, `is_platform_admin()`.

## Stale files — do not follow

- `chat-app/k8s/` is pre-GitOps legacy (incl. a `secret.yaml` recipe using `kubectl create` and the **revoked cockpit-bot**). The live manifests are `k8s-manifests/apps/chat-app/`; secrets come from Vault/ESO; registry pull secret authenticates as claude-bot.
- `chat-app/.mcp.json` (tracked) and the untracked root `.mcp.json` point the Supabase MCP at the **legacy cloud project** `xtnqdyjldgmfhtvtggmm`. Do not use it against data; it needs repointing at the self-hosted instance when MCP is revisited.

## Verify

The authenticated UI (behind MFA) is code-audited, not browser-verified past login — say so. Never claim a web change "verified" from curl.
