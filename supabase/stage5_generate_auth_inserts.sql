-- Stage 5 — AUTH INSERT-script generator (run in the OLD project: erabfcnmgnrvzwjkrdry)
--
-- WHAT THIS IS: companion to stage5_generate_inserts.sql, but for the auth
--   schema. Run it once in the OLD project's SQL editor; it returns ONE row /
--   ONE column (`auth_import_script`) containing a ready-to-run script that
--   recreates auth.users + auth.identities in the NEW project
--   (fsywsxifrvdtziiwhkjf) with the ORIGINAL user UUIDs preserved.
--
-- WHY UUID-PRESERVING: stage5_generate_inserts.sql inserts profiles.id /
--   user_roles.user_id / team_members.user_id with the old user UUIDs. Those
--   FKs only resolve if auth.users in the new project has the SAME ids. The
--   Admin API (createUser) mints NEW uuids and would dangle every one of those
--   FKs — that is why this copies the rows directly instead.
--
-- HOW IT WORKS: per row it emits
--     INSERT INTO auth.users (<non-generated cols>)
--     SELECT <same cols> FROM jsonb_populate_record(NULL::auth.users, '<json>'::jsonb);
--   jsonb_populate_record rebuilds each row by column name, so all ~30
--   GoTrue columns (jsonb metadata, timestamps, uuid, null encrypted_password
--   for OAuth users) come back correctly without hardcoding them. Generated
--   columns (e.g. confirmed_at) are excluded so the INSERT doesn't try to
--   write them. encrypted_password is bcrypt and portable across Supabase
--   projects, so email/password logins keep working.
--
-- RUN ORDER:
--   0. NEW project auth.users must be EMPTY (no stray test signups) or you'll
--      hit PK / unique(email) conflicts.
--   1. Configure the Google provider in the NEW project with the SAME OAuth
--      client id + secret as the old one, and matching redirect/Site URLs,
--      BEFORE anyone logs in — the identity provider_id (sub) is client-bound.
--      (Apple is intentionally out of scope — it was never set up; there are
--      no Apple identity rows to migrate.)
--   2. Paste + run THIS script's output in the NEW project. Hosted Supabase
--      does not allow disabling triggers on auth.users (42501: must be owner
--      of table users) even as postgres, so on_auth_user_created fires for
--      every inserted row. That's expected and handled downstream: it
--      auto-creates a throwaway company + profile + user_role per user,
--      which stage5_generate_inserts.sql's app-data import then overwrites
--      (profiles) or no-ops around (user_roles) via ON CONFLICT. The
--      trigger-created companies are harmless debris — see the cleanup
--      query in stage5_generate_inserts.sql's header.
--   3. Paste + run the stage5_generate_inserts.sql output (app data).
--   4. Smoke test: one email/password login and one Google login.
--
-- NOTE: sessions / refresh_tokens are intentionally NOT migrated — users just
--   sign in again. The non-generated column list is read from the OLD project;
--   if the import errors on an unknown column, drop that column from the
--   generated list (old/new GoTrue version skew — rare).

WITH ucols AS (
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) AS cols
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'users' AND is_generated = 'NEVER'
),
icols AS (
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) AS cols
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'identities' AND is_generated = 'NEVER'
),
users_b AS (
  SELECT string_agg(format(
    'INSERT INTO auth.users (%s) SELECT %s FROM jsonb_populate_record(NULL::auth.users, %L::jsonb);',
    uc.cols, uc.cols, to_jsonb(u)::text
  ), E'\n' ORDER BY u.created_at) AS s
  FROM auth.users u CROSS JOIN ucols uc
),
identities_b AS (
  SELECT string_agg(format(
    'INSERT INTO auth.identities (%s) SELECT %s FROM jsonb_populate_record(NULL::auth.identities, %L::jsonb);',
    ic.cols, ic.cols, to_jsonb(i)::text
  ), E'\n' ORDER BY i.created_at) AS s
  FROM auth.identities i CROSS JOIN icols ic
)
SELECT
     E'BEGIN;\n\n'
  || E'-- NOTE: on_auth_user_created WILL fire per row inserted below (hosted\n'
  || E'-- Supabase does not permit disabling triggers on auth.users). It creates\n'
  || E'-- a throwaway company + profile + user_role per user; the app-data\n'
  || E'-- import (stage5_generate_inserts.sql) cleans that up.\n\n'
  || E'-- auth.users\n'      || COALESCE((SELECT s FROM users_b),      '-- (no rows)') || E'\n\n'
  || E'-- auth.identities\n' || COALESCE((SELECT s FROM identities_b), '-- (no rows)') || E'\n\n'
  || E'COMMIT;\n'
  AS auth_import_script;
