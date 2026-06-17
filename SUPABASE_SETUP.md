# Connecting Supabase (Phase 3)

The Apply form and Admin review screen are fully built. They run in a safe
"preview" mode until you connect Supabase. Follow these steps to go live.

## 1. Create a Supabase project
1. Go to https://supabase.com → sign in → **New project**.
2. Give it a name (e.g. `golden-shadow`), set a database password, pick a region.
3. Wait ~2 minutes for it to provision.

## 2. Run the database schema
1. In your project, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, copy its contents, paste, and **Run**.
3. You should see the `applications` table under **Table Editor**.

## 3. Lock down sign-ups (so only you are an admin)
1. **Authentication → Providers → Email**: make sure Email is enabled.
2. Turn **OFF** "Enable sign-ups" (so the public can't create admin accounts).
3. **Authentication → Users → Add user**: create your own admin account
   (email + password). This is what you'll use to log in at `/admin/login`.

## 4. Add your keys to the app
1. In Supabase: **Project Settings → API**. Copy:
   - **Project URL**
   - **anon / public** key
2. In this repo, open `.env.local` and fill them in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
   ```
3. Restart the dev server: `npm run dev`.

## 4b. Make yourself an admin (Phase 5 — roles)
New accounts default to the `creator` role. Promote your own user to `admin`
so you can reach `/admin`. In **SQL Editor**, run (with your email):
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## 4c. Give a creator a dashboard (optional)
To let a creator edit their public profile at `/dashboard`, link their account
to a roster slug (slugs come from `lib/data.ts`, e.g. `alexandra-m`):
```sql
update public.profiles set creator_slug = 'alexandra-m'
where id = (select id from auth.users where email = 'creator@example.com');
```
They sign in at `/login`, edit their profile, and changes appear on
`/creators/alexandra-m` within a minute.

## 5. Test it end-to-end
1. Visit `/apply`, submit a test application → you should see "Application received".
2. Visit `/admin` → you'll be redirected to `/admin/login`.
3. Sign in with the admin user you created → you should see your test application.
4. Try **Approve** / **Decline** → the status updates live.

## Notes
- The **anon key is safe to expose** to the browser — Row Level Security (set up
  by the schema) is what actually protects the data. The public can only INSERT
  applications; only signed-in admins can read or update them.
- For production on Vercel, add the same two env vars in
  **Vercel → Project → Settings → Environment Variables**.
- Later we can add a `profiles.is_admin` flag if you want multiple staff logins
  with different permission levels.
