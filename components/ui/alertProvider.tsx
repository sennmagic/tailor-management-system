"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { X, UserPlus, Ruler, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type AlertVariant = "success" | "destructive" | "info" | "warning";

interface AlertConfig {
  msg: string;
  variant: AlertVariant;
  duration?: number;
  sound?: boolean;
  showCustomerPopup?: boolean;
  customerData?: any;
}

const AlertContext = createContext<{ 
  showAlert: (config: string | AlertConfig, variant?: AlertVariant) => void;
  hideAlert: () => void;
  showCustomerSuccessPopup: (customerData: any) => void;
} | undefined>(undefined);

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}

// Sound effects disabled
const playSound = (type: AlertVariant) => {
  // Voice effects removed as requested
  return;
};

// Simple message processing - just return the original message
const processMessage = (message: string, variant: AlertVariant): string => {
  return message;
};


// Customer Success Popup Component
function CustomerSuccessPopup({ 
  customerData, 
  onClose, 
  onCreateMeasurements, 
  onGoToMeasurements 
}: { 
  customerData: any; 
  onClose: () => void; 
  onCreateMeasurements: () => void; 
  onGoToMeasurements: () => void; 
}) {
  const customerName = customerData?.name || 
    customerData?.customerName || 
    customerData?.firstName || 
    (customerData?.firstName && customerData?.lastName ? `${customerData.firstName} ${customerData.lastName}` : '') ||
    'Customer';
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Customer Added Successfully!
          </h3>
          <p className="text-gray-600 text-lg">
            {customerName}'s information has been saved
          </p>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={onCreateMeasurements}
            className="w-full bg-[#2e7d32] hover:bg-[#18281f] text-white py-3 text-base font-medium flex items-center justify-center gap-3"
          >
            <Ruler className="w-5 h-5" />
            Create New Measurements
          </Button>
          
          <Button
            onClick={onGoToMeasurements}
            variant="outline"
            className="w-full py-3 text-base font-medium flex items-center justify-center gap-3 border-[#2e7d32] text-[#2e7d32] hover:bg-[#2e7d32] hover:text-white"
          >
            <ArrowRight className="w-5 h-5" />
            View Measurements
          </Button>
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full py-2 text-gray-500 hover:text-gray-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [alert, setAlert] = useState<{
    msg: string;
    variant: AlertVariant;
    duration: number;
    sound: boolean;
  } | null>(null);
  
  const [customerPopup, setCustomerPopup] = useState<{
    show: boolean;
    customerData: any;
  }>({ show: false, customerData: null });
  
  const showCustomerSuccessPopup = (customerData: any) => {
    setCustomerPopup({ show: true, customerData });
  };
  
  const hideCustomerPopup = () => {
    setCustomerPopup({ show: false, customerData: null });
  };
  
  const handleCreateMeasurements = () => {
    hideCustomerPopup();
    
    // Get the latest customer ID from sessionStorage
    const customerId = sessionStorage.getItem('latestCustomerId') || 
                      customerPopup.customerData?._id || 
                      customerPopup.customerData?.id;
    
    if (customerId) {
      router.push(`/measurements?customerId=${customerId}&mode=create&autoOpen=true`);
    } else {
      router.push('/measurements?mode=create&autoOpen=true');
    }
  };
  
  const handleGoToMeasurements = () => {
    hideCustomerPopup();
    // Navigate to measurements page
    router.push('/measurements');
  };
  
  const showAlert = (config: string | AlertConfig, variant: AlertVariant = "destructive") => {
    const alertConfig = typeof config === 'string' 
      ? { msg: config, variant, duration: 4000, sound: false }
      : { duration: 4000, sound: false, ...config };
    
    const processedMsg = processMessage(alertConfig.msg, alertConfig.variant);
    
    // Check if this is a customer creation success
    const isCustomerCreation = variant === 'success' && 
      (processedMsg.includes('Created successfully') ||
       processedMsg.includes('create') ||
       processedMsg.includes('add'));
    
    if (isCustomerCreation && alertConfig.showCustomerPopup && alertConfig.customerData) {
      // Show customer success popup instead of regular alert
      showCustomerSuccessPopup(alertConfig.customerData);
      return;
    }
    
    setAlert({
      msg: processedMsg,
      variant: alertConfig.variant,
      duration: alertConfig.duration,
      sound: alertConfig.sound
    });
    
    if (alertConfig.sound) {
      playSound(alertConfig.variant);
    }
  };
  
  const hideAlert = () => setAlert(null);

  useEffect(() => {
    if (alert && alert.duration > 0) {
      const timer = setTimeout(() => setAlert(null), alert.duration);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, showCustomerSuccessPopup }}>
      {children}
      {alert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm mx-4">
          <Alert variant={alert.variant} className="shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-left leading-relaxed">
                {alert.msg}
              </span>
              <button
                onClick={hideAlert}
                className="p-1 hover:bg-black/10 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Alert>
        </div>
      )}
      {customerPopup.show && (
        <CustomerSuccessPopup
          customerData={customerPopup.customerData}
          onClose={hideCustomerPopup}
          onCreateMeasurements={handleCreateMeasurements}
          onGoToMeasurements={handleGoToMeasurements}
        />
      )}
    </AlertContext.Provider>
  );
}