"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/events/Icon";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/leads", label: "Leads", icon: "Inbox" },
  { href: "/admin/reservations", label: "Reservations", icon: "CalendarDays" },
  { href: "/admin/zones", label: "Zones", icon: "LayoutGrid" },
  { href: "/admin/pricing", label: "Pricing", icon: "Tag" },
  { href: "/admin/analytics", label: "Analytics", icon: "ChartColumn" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav">
      {LINKS.map((l) => {
        const active =
          l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : ""}>
            <Icon name={l.icon} size={17} /> {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
