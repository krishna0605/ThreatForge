# Security Blockers 1–3 Release Runbook

This release is intentionally staging-first. Do not run the production
promotion workflow until the staging workflow has completed successfully and
its Git SHA, bundle SHA-256, provider deployment IDs, and acceptance evidence
have been reviewed.

## Required isolated resources

- A Render staging backend created from `render.yaml`.
- A Vercel staging project whose `BACKEND_URL` and
  `NEXT_PUBLIC_API_URL` point only to the staging backend.
- A separate Supabase staging project with the current migrations and no
  production user data.
- A separate Hugging Face staging Space.
- A dedicated staging smoke-test user.
- Unique staging values for the Flask secret, JWT secret, Fernet encryption
  key, Supabase service role, ML API key, and provider access tokens.

Confirm the existing production Render region before applying the Blueprint.
The Blueprint currently declares `oregon` for both services so their runtime
shape is deterministic; change both entries together if the existing
production service is in another immutable Render region.

## GitHub environments and secrets

Configure protected `staging` and `production` GitHub environments. Production
must require an accountable reviewer.

Staging secrets:

- `RENDER_API_KEY`, `RENDER_STAGING_SERVICE_ID`, `RENDER_STAGING_URL`
- `HF_TOKEN`, `HF_STAGING_SPACE_NAME`, `HF_STAGING_URL`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_STAGING_PROJECT_ID`
- `VERCEL_AUTOMATION_BYPASS_SECRET`
- `STAGING_SMOKE_TEST_EMAIL`, `STAGING_SMOKE_TEST_PASSWORD`

Production secrets:

- `RENDER_API_KEY`, `RENDER_PRODUCTION_SERVICE_ID`, `RENDER_PRODUCTION_URL`
- `HF_TOKEN`, `HF_SPACE_NAME`, `HF_PRODUCTION_URL`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `VERCEL_AUTOMATION_BYPASS_SECRET`
- `PRODUCTION_SMOKE_TEST_EMAIL`, `PRODUCTION_SMOKE_TEST_PASSWORD`

The smoke users must be dedicated audit accounts. The workflow creates one
uniquely named synthetic text-file scan and deletes that exact scan after
success.

## Pre-deployment MFA validation

1. Confirm the production `ENCRYPTION_KEY` is unchanged and is a valid Fernet
   key. Do not rotate it in this release.
2. Run `python backend/scripts/audit_mfa_integrity.py` from a controlled
   administrative environment with production read-only access.
3. Review counts only. The command never prints identifiers, ciphertext,
   recovery codes, or key material and returns non-zero on any inconsistent
   record.
4. Stop the release if any count other than `mfa_enabled_profiles` is non-zero.
   Use a separately approved identity-recovery procedure; never repair records
   automatically during deployment.

## Staging

1. Merge the tested security release to `main`.
2. Run **Deploy Security Release to Staging** with the exact full Git SHA.
3. Review the workflow summary and retain:
   - staging workflow run ID;
   - release Git SHA;
   - model bundle SHA-256;
   - Hugging Face staging commit;
   - Render deployment ID from the job log;
   - Vercel staging deployment URL.
4. Confirm the password-to-MFA flow manually with valid and invalid TOTP
   values, one recovery code, and a controlled wrong-key simulation.
5. Confirm the wrong-key simulation returns `503`, issues no tokens, changes no
   MFA profile fields, and emits only the sanitized security event.

## Production promotion

Run **Promote Security Release to Production** with:

- `release_sha`: the accepted staging Git SHA;
- `staging_run_id`: the successful staging workflow run;
- `expected_bundle_sha256`: the SHA-256 from that run.

The production workflow downloads the exact staging artifact, verifies its
digest and embedded Git SHA, deploys the unchanged directory to Hugging Face,
deploys the exact Git revision to Render, deploys the same revision to Vercel,
executes health and authenticated smoke gates, and observes readiness for one
hour. A failed promotion invokes the recorded provider rollback targets.

Do not close F-001, F-002, or F-003 until the workflow summary, provider
deployment IDs, sanitized logs, one-hour observation, and manual MFA
acceptance evidence are attached to the audit record.
