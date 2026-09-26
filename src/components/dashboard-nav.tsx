"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  MessagesSquare,
  UserRound,
  Bell,
  Bookmark,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { AccountRole } from "@/lib/domain";
export function DashboardNav({ role }: { role: AccountRole }) {
  const path = usePathname();
  const items = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    {
      href: role === "COMPANY" ? "/dashboard/requirements" : "/requirements",
      label: role === "COMPANY" ? "My requirements" : "Find work",
      icon: BriefcaseBusiness,
    },
    {
      href: "/dashboard/applications",
      label:
        role === "COMPANY"
          ? "Applicants & proposals"
          : role === "VENDOR"
            ? "My proposals"
            : "My applications",
      icon: Users,
    },
    { href: "/dashboard/deployments", label: "Deployments", icon: Truck },
    { href: "/dashboard/messages", label: "Messages", icon: MessagesSquare },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/profile", label: "My profile", icon: UserRound },
    ...(["WORKER", "VENDOR"].includes(role)
      ? [
          {
            href: "/dashboard/saved",
            label: "Saved requirements",
            icon: Bookmark,
          },
        ]
      : []),
    ...(role === "ADMIN"
      ? [
          {
            href: "/dashboard/admin",
            label: "Administration",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];
  return (
    <aside className="sidebar">
      <small>{role} WORKSPACE</small>
      {items.map((i) => (
        <Link
          className={path === i.href ? "active" : ""}
          href={i.href}
          key={i.href}
        >
          <i.icon size={17} />
          {i.label}
        </Link>
      ))}
    </aside>
  );
}
