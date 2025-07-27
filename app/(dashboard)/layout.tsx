
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertProvider } from "@/components/ui/alertProvider";
import { EmployeeProvider } from "@/components/context/EmployeeContext";
import { fetchAPI } from "@/lib/apiService";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (

      <EmployeeProvider>
        <AlertProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </AlertProvider>
      </EmployeeProvider>
  );
} 