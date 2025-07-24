"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { Alert } from "@/components/ui/alert";

type AlertVariant = "success" | "destructive";

const AlertContext = createContext<{ showAlert: (msg: string, variant?: AlertVariant) => void } | undefined>(undefined);

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{ msg: string; variant: AlertVariant } | null>(null);
  const showAlert = (msg: string, variant: AlertVariant = "destructive") => setAlert({ msg, variant });

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
          <Alert variant={alert.variant}>{alert.msg}</Alert>
        </div>
      )}
    </AlertContext.Provider>
  );
} 