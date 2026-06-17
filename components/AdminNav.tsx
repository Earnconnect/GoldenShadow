import Link from "next/link";
import { signOut } from "@/app/admin/actions";

const TABS: { href: string; key: string; label: string }[] = [
  { href: "/admin", key: "applications", label: "Applications" },
  { href: "/admin/orders", key: "orders", label: "Orders" },
  { href: "/admin/inquiries", key: "inquiries", label: "Inquiries" },
  { href: "/admin/studio", key: "studio", label: "Studio" },
  { href: "/admin/journal", key: "journal", label: "Journal" },
  { href: "/admin/creators", key: "creators", label: "Creators" },
  { href: "/admin/users", key: "users", label: "Users" },
  { href: "/admin/insights", key: "insights", label: "Insights" },
];

export type AdminTab =
  | "applications"
  | "orders"
  | "inquiries"
  | "studio"
  | "journal"
  | "creators"
  | "users"
  | "insights";

export default function AdminNav({ active }: { active: AdminTab }) {
  return (
    <div className="admin-bar">
      <div className="admin-tabs" style={{ margin: 0 }}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`filter-chip${active === t.key ? " active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <form action={signOut}>
        <button type="submit" className="admin-signout">
          Sign out
        </button>
      </form>
    </div>
  );
}
