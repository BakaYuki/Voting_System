# Project Awards Voting System

An accessible Next.js App Router voting system backed by Supabase PostgreSQL.

## Architecture

- **Next.js App Router** renders the public pages and server API routes.
- **Supabase Auth** is used for administrator email/password sessions. The service-role key is server-only.
- **PostgreSQL functions** own vote validation, category consistency, the three-vote limit, and the voting-status lock.
- **Anonymous voters** receive a cryptographically random `HttpOnly` cookie. Only its SHA-256 hash is stored.
- **Results** are calculated by the `project_results` database view; scores are never manually stored.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key, and service-role key.
2. Apply `supabase/migrations/20261027000000_initial_schema.sql` in the Supabase SQL editor or with the Supabase CLI.
3. Create the first admin user in Supabase Auth, then insert its UUID into `admin_users` from the SQL editor.
4. Run `npm run dev`.

The initial database state has voting closed. An administrator must open it from the eventual protected settings action before public voting can begin. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code.

## Security notes

The vote API never accepts a voter ID from the request body. The database function locks the global settings row before checking status and recording a vote, so closing voting and vote submissions coordinate transactionally. RLS prevents public content/settings writes; privileged server operations use the service-role client.

Cookie identity limits are per browser identity, not per real person. A visitor can obtain a new identity by clearing cookies, using private browsing, or switching devices. Anonymous cookies cannot guarantee one-person-one-vote enforcement.

## Verification

```powershell
npm run lint
npm run build
```
