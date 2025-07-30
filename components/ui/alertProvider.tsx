"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { X } from "lucide-react";

type AlertVariant = "success" | "destructive";

const AlertContext = createContext<{ showAlert: (msg: string, variant?: AlertVariant) => void } | undefined>(undefined);

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{ msg: string; variant: AlertVariant } | null>(null);
  
  const showAlert = (msg: string, variant: AlertVariant = "destructive") => {
    setAlert({ msg, variant });
  };

  // Auto-dismiss all alerts after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
          <Alert variant={alert.variant} className="relative">
            <div className="flex items-start justify-between">
              <span className="flex-1">{alert.msg}</span>
              <button
                onClick={() => setAlert(null)}
                className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Alert>
        </div>
      )}
    </AlertContext.Provider>
  );
} 