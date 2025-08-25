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

// Simple clean sounds
const playSound = (type: AlertVariant) => {
  try {
    const audio = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    
    osc.connect(gain);
    gain.connect(audio.destination);
    
    osc.frequency.value = type === 'success' ? 800 : type === 'warning' ? 600 : 400;
    gain.gain.value = 0.05;
    
    osc.start();
    setTimeout(() => osc.stop(), 100);
  } catch {}
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

// Better speech - more natural Nepali pronunciation
const speakInNepali = (text: string, variant: AlertVariant) => {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Slower, clearer speech settings for better Nepali pronunciation
  utterance.rate = 0.6; // Much slower for clarity
  utterance.pitch = variant === 'success' ? 1.1 : variant === 'destructive' ? 0.9 : 1.0;
  utterance.volume = 0.8;
  
  // Wait for voices to load, then find best Nepali voice
  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // Priority: Real Nepali → Hindi → English (India) → Any clear voice
    const nepaliVoice = voices.find(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      
      // Look for actual Nepali voices first
      if (lang.includes('ne-np') || name.includes('nepali')) return true;
      
      // Then Hindi voices which can handle Devanagari
      if (lang.includes('hi-in') && name.includes('google')) return true;
      
      // English India voices are often clearer for mixed content
      if (lang.includes('en-in') && name.includes('google')) return true;
      
      return false;
    });
    
    // Fallback to clearest English voice
    const clearVoice = voices.find(voice => 
      voice.name.includes('Google UK English Female') ||
      voice.name.includes('Microsoft Zira') ||
      voice.name.includes('Alex')
    );
    
    if (nepaliVoice) {
      utterance.voice = nepaliVoice;
      utterance.lang = nepaliVoice.lang;
      // Even slower for non-native voices
      if (!nepaliVoice.lang.includes('ne')) {
        utterance.rate = 0.5;
      }
    } else if (clearVoice) {
      utterance.voice = clearVoice;
      utterance.rate = 0.5; // Very slow for English voices reading Nepali
    }
  };
  
  // Handle voices loading
  if (window.speechSynthesis.getVoices().length > 0) {
    setVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      setVoice();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }
  
  // Add pauses for better pronunciation
  const textWithPauses = text.replace(/[।,]/g, '। ');
  utterance.text = textWithPauses;
  
  window.speechSynthesis.speak(utterance);
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
      ? { msg: config, variant, duration: 4000, sound: true, speech: true }
      : { duration: 4000, sound: true, speech: true, ...config };
    
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