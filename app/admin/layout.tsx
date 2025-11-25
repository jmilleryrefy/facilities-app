import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/my-requests");
  }

  return <DashboardLayout user={session.user}>{children}</DashboardLayout>;
}
