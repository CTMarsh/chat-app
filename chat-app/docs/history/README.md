# chat-app — history

Narrative moved out of the CLAUDE.md files (which keep only the rules).

| Date | Note |
|---|---|
| 2026-03-17 | CI deploy migrated from kubectl to committing image tags into `k8s-manifests` (chat-app !5); ArgoCD syncs. `chat-app/k8s/` here dates from before that and is legacy. |
| 2026-07-16 | **Constellation rebrand.** NauticalTheme (ocean `#4A8BC2` / navy `#1A2938` / gold `#D4A04A`) retired; full rebrand + cohesion pass; login = canonical split-hero AuthShell; marketing landing at `/`. Last leftover was `components/providers/preferences-provider.tsx`. ChatArk (iOS, project 40) code-rebranded `NauticalTheme.swift` → `ConstellationTheme.swift` in chatark MR !46 (code-verified only — no Xcode on the build box). |
| 2026-07-17 | After the `ctmarsh/` → `homelab/` group rename (registry paths do not redirect), images were rebuilt under `homelab/`; the deploy job then failed at MR creation (suspected `assignee_id: 5` revoked cockpit-bot relic). Fixed later (`fix/ci-deploy-relics`). |
| 2026-07/08 | Public/unauth surface hardening (SSRF guard on `/api/link-preview`, IDOR, rate limit, origin, session expiry), MFA enrolment on-ramp for MFA-less admins, first automated tests (167) incl. a live IPv6 SSRF bypass fix, Trivy CVE gate, Constellation type + spacing scale. |
| 2026-09 | npm/npx stripped from the runtime image (npm's vendored node-tar = CVE-2026-59873); Next.js 16.1.6 → 16.3.6 for two CRITICAL CVEs. |
| 2026-10-23 | Node 20 → **22.23.4** for Node2Shell (CVE-2026-111497), chat !36. Deploy then held by **unrelated Next.js CVEs** at the Trivy gate (estate dashboard, START HERE step 2). |
