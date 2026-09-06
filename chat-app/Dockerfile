FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
# NPM_TOKEN (CI_JOB_TOKEN via kaniko --build-arg) authenticates npm to the
# project-63 GitLab registry for @noahsark/constellation. Committed .npmrc uses
# ${NPM_TOKEN}; the ARG isn't baked into the final runner image.
ARG NPM_TOKEN
COPY package.json package-lock.json .npmrc ./
RUN NPM_TOKEN="$NPM_TOKEN" npm ci --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Strip npm/npx from the RUNTIME image. Next.js standalone output bundles its
# own node_modules and this stage's entrypoint is `node server.js` — npm is
# never invoked at runtime, it is only present because node:20-alpine ships it.
#
# It is not free, though: npm vendors its own copy of node-tar, and
# /usr/local/lib/node_modules/npm/node_modules/tar was 6.2.1 — CVE-2026-59873,
# CRITICAL (denial of service via a crafted gzip bomb), fixed in 7.5.19. That
# single finding is what the new Trivy gate in .gitlab-ci.yml trips on, so
# every pipeline since 2026-08-20 has failed at `trivy:scan` and `deploy:k8s`
# has been skipped for 16 days (alerts PipelineDeployStale +
# PipelineDeployStaleCritical). The gate was right; the image really did ship a
# CRITICAL.
#
# Deleting npm is the correct fix rather than pinning a transitive dependency:
# the vulnerable copy is not ours to pin (it belongs to npm), and a production
# image should not carry a package manager at all. Waiting for an upstream
# node:20-alpine rebuild would leave the pipeline red in the meantime and
# reintroduce the CVE on any base-image bump that lags npm.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
