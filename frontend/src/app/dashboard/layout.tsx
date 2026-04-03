import { DashboardLayout } from "@/components/layout";
import { WelcomeModal } from "@/components/dashboard/welcome-modal";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardLayout>{children}</DashboardLayout>
      <WelcomeModal />
    </>
  );
}
