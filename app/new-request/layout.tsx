import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";

export default async function NewRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardLayout user={session.user}>{children}</DashboardLayout>;
}
