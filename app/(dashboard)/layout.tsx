import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertProvider } from "@/components/ui/alertProvider";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AlertProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AlertProvider>
  );
} 