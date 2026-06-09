import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { RealtimeNotifier } from "@/components/admin/RealtimeNotifier";
import "../admin.css";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated users; this is a safety net.
  if (!user) redirect("/admin/login");

  // Authorization: the user must have a staff record.
  const { data: staff } = await supabase
    .from("staff")
    .select("email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!staff) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="brand-mark">CHIANG&nbsp;MAI</div>
          <div className="brand-sub">Events · Staff Console</div>
          <p style={{ color: "var(--sub)", lineHeight: 1.6 }}>
            You&apos;re signed in as <strong>{user.email}</strong>, but this account
            isn&apos;t linked to a staff profile yet. Ask an administrator to grant
            access (see <code>docs/ADMIN.md</code>).
          </p>
          <div style={{ marginTop: 18 }}>
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">
          CHIANG&nbsp;MAI
          <small>Events Console</small>
        </div>
        <AdminNav />
        <div className="admin-side-foot">
          <div className="admin-user">
            {staff.email}
            <br />
            <span style={{ color: "var(--gold-lite)", textTransform: "capitalize" }}>
              {staff.role}
            </span>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="admin-main">{children}</main>
      <RealtimeNotifier />
    </div>
  );
}
