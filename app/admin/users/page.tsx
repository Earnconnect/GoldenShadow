import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import AdminNav from "@/components/AdminNav";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSession, isAdmin, PLAN_LABEL } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllCreators } from "@/lib/creators-db";
import { updateUser, inviteUser } from "./actions";

export const metadata: Metadata = {
  title: "Users — Golden Shadow Admin",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  role: string;
  plan: string;
  creator_slug: string | null;
  full_name: string | null;
};

const PLANS = ["none", "starter", "studio", "platform"];

function fmt(iso?: string) {
  return iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Users" />
          <section className="page-section">
            <div className="empty-state">
              <h3>Admin not connected yet</h3>
              <p>Connect Supabase to manage members, roles, and plans.</p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!isAdmin(session)) redirect("/dashboard");

  const admin = createAdminClient();
  if (!admin) {
    return (
      <>
        <Nav />
        <main>
          <PageHeader eyebrow="Studio Admin" title="Users" />
          <section className="page-section">
            <AdminNav active="users" />
            <div className="empty-state" style={{ marginTop: "28px" }}>
              <h3>Service-role key required</h3>
              <p>
                User management needs <code>SUPABASE_SERVICE_ROLE_KEY</code> set
                in your environment.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const users = usersData?.users ?? [];
  const { data: profileData } = await admin
    .from("profiles")
    .select("id, role, plan, creator_slug, full_name");
  const profiles = new Map(
    ((profileData ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );
  const creators = await getAllCreators();

  return (
    <>
      <Nav />
      <main>
        <PageHeader eyebrow="Studio Admin" title="Users" />
        <section className="page-section">
          <AdminNav active="users" />

          {notice && (
            <p className="form-success" style={{ marginTop: "28px" }}>
              {notice}
            </p>
          )}

          {/* Invite */}
          <p className="profile-section-label" style={{ marginTop: "32px" }}>
            Invite a member
          </p>
          <form action={inviteUser} className="invite-row">
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              required
            />
            <button type="submit" className="btn-dark">Send invite</button>
          </form>
          <p className="form-fineprint" style={{ marginTop: "8px" }}>
            Sends a Supabase invite email. Set the new member&apos;s plan and
            linked creator below once they appear.
          </p>

          {/* Per-row edit forms (referenced by the table controls) */}
          {users.map((u) => (
            <form key={u.id} id={`u-${u.id}`} action={updateUser} hidden>
              <input type="hidden" name="id" value={u.id} />
            </form>
          ))}

          <p className="profile-section-label" style={{ marginTop: "44px" }}>
            Members ({users.length})
          </p>
          <div className="admin-scroll">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Linked creator</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const p = profiles.get(u.id);
                  const fid = `u-${u.id}`;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="app-name">
                          {p?.full_name || u.email}
                        </div>
                        <div className="app-email">{u.email}</div>
                      </td>
                      <td>
                        <select name="role" form={fid} defaultValue={p?.role ?? "creator"} className="mini-select">
                          <option value="creator">creator</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        <select name="plan" form={fid} defaultValue={p?.plan ?? "none"} className="mini-select">
                          {PLANS.map((pl) => (
                            <option key={pl} value={pl}>
                              {PLAN_LABEL[pl] ?? pl}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select name="creator_slug" form={fid} defaultValue={p?.creator_slug ?? ""} className="mini-select">
                          <option value="">— none —</option>
                          {creators.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{fmt(u.created_at)}</td>
                      <td>
                        <button type="submit" form={fid} className="filter-chip">
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
