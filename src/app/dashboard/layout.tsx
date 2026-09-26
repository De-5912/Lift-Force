import { requireUser } from "@/lib/data";
import { DashboardNav } from "@/components/dashboard-nav";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="dashboard">
      <DashboardNav role={user.role} />
      <div className="dashboard-main">{children}</div>
    </div>
  );
}
