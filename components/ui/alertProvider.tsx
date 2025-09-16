"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { X } from "lucide-react";

type AlertVariant = "success" | "destructive" | "info" | "warning";

interface AlertConfig {
  msg: string;
  variant: AlertVariant;
  duration?: number;
  sound?: boolean;
  speech?: boolean;
}

const AlertContext = createContext<{ 
  showAlert: (config: string | AlertConfig, variant?: AlertVariant) => void;
  hideAlert: () => void;
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

// Smart message processing - keeps original errors, translates common patterns
const processMessage = (message: string, variant: AlertVariant): string => {
  // For errors, keep the original service message but add Nepali context if needed
  if (variant === 'destructive') {
    // If it's already in Nepali or a clear error message, keep it as-is
    if (message.includes('छ') || message.includes('भयो') || message.length > 50) {
      return message;
    }
    
    // Add Nepali context to short English errors
    const msg = message.toLowerCase();
    if (msg.includes('network') || msg.includes('connection')) {
      return `${message} (इन्टरनेट जडान समस्या)`;
    }
    if (msg.includes('server') || msg.includes('500')) {
      return `${message} (सर्भर समस्या)`;
    }
    if (msg.includes('unauthorized') || msg.includes('403')) {
      return `${message} (अनुमति छैन)`;
    }
    if (msg.includes('not found') || msg.includes('404')) {
      return `${message} (फेला परेन)`;
    }
    if (msg.includes('timeout')) {
      return `${message} (समय सकियो)`;
    }
    if (msg.includes('validation') || msg.includes('invalid')) {
      return `${message} (गलत जानकारी)`;
    }
    
    // For unknown errors, show original message with generic Nepali help
    return `${message} (समस्या भयो)`;
  }
  
  // Form validation - Natural Nepali
  if (message.toLowerCase().includes('required') && variant !== 'destructive') {
    const msg = message.toLowerCase();
    if (msg.includes('customer')) return 'ग्राहकको नाम लेख्नुहोस्';
    if (msg.includes('factory')) return 'कारखानाको नाम छान्नुहोस्';
    if (msg.includes('measurement')) return 'साइज राख्नुहोस्';
    if (msg.includes('catalog')) return 'सामानको सूची छान्नुहोस्';
    if (msg.includes('email')) return 'इमेल ठेगाना लेख्नुहोस्';
    if (msg.includes('phone')) return 'फोन नम्बर राख्नुहोस्';
    if (msg.includes('name')) return 'नाम लेख्नुहोस्';
    if (msg.includes('address')) return 'ठेगाना लेख्नुहोस्';
    if (msg.includes('date')) return 'मिति छान्नुहोस्';
    if (msg.includes('quantity')) return 'संख्या राख्नुहोस्';
    return 'सबै जानकारी भर्नुहोस्';
  }
  
  // Success messages - Natural flow
  if (variant === 'success') {
    const msg = message.toLowerCase();
    if (msg.includes('update')) return 'जानकारी अपडेट भयो';
    if (msg.includes('create') || msg.includes('add')) return 'नयाँ जानकारी थपियो';
    if (msg.includes('save')) return 'जानकारी सुरक्षित भयो';
    if (msg.includes('delete')) return 'जानकारी मिटाइयो';
    if (msg.includes('upload')) return 'फाइल अपलोड भयो';
    if (msg.includes('send')) return 'सन्देश पठाइयो';
    if (msg.includes('login')) return 'लगइन सफल भयो';
    if (msg.includes('register')) return 'दर्ता सफल भयो';
    return 'काम सकियो';
  }
  
  // Warning messages
  if (variant === 'warning') {
    const msg = message.toLowerCase();
    if (msg.includes('confirm')) return 'निश्चित गर्नुहोस्';
    if (msg.includes('delete')) return 'मिटाउन चाहनुहुन्छ?';
    if (msg.includes('logout')) return 'बाहिर निस्कनुहुन्छ?';
    if (msg.includes('unsaved')) return 'परिवर्तन सुरक्षित गरेको छैन';
    return message; // Keep original warning message
  }
  
  // Info messages
  if (variant === 'info') {
    const msg = message.toLowerCase();
    if (msg.includes('loading')) return 'लोड गर्दैछ, पर्खनुहोस्';
    if (msg.includes('processing')) return 'प्रक्रिया चलिरहेको छ';
    if (msg.includes('connecting')) return 'जडान गर्दैछ';
    return message; // Keep original info message
  }
  
  // Default: return original message
  return message;
};

// Speech synthesis disabled
const speakInNepali = (text: string, variant: AlertVariant) => {
  // Voice effects removed as requested
  return;
};

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{
    msg: string;
    variant: AlertVariant;
    duration: number;
    sound: boolean;
    speech: boolean;
  } | null>(null);
  
  const showAlert = (config: string | AlertConfig, variant: AlertVariant = "destructive") => {
    const alertConfig = typeof config === 'string' 
      ? { msg: config, variant, duration: 4000, sound: false, speech: false }
      : { duration: 4000, sound: false, speech: false, ...config };
    
    const processedMsg = processMessage(alertConfig.msg, alertConfig.variant);
    
    setAlert({
      msg: processedMsg,
      variant: alertConfig.variant,
      duration: alertConfig.duration,
      sound: alertConfig.sound,
      speech: alertConfig.speech
    });
    
    if (alertConfig.sound) {
      playSound(alertConfig.variant);
    }
    
    if (alertConfig.speech) {
      // Small delay to let sound finish
      setTimeout(() => speakInNepali(processedMsg, alertConfig.variant), 100);
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
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
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
                aria-label="बन्द गर्नुहोस्"
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