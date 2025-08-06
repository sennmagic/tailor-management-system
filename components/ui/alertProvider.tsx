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

// Sound effects for different alert types
const playSound = (type: 'success' | 'update' | 'error') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'success':
        // Pleasant ascending tone for general success
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
        break;
      case 'update':
        // Special sound for update success - two quick beeps
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
        break;
      case 'error':
        // Descending tone for errors
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        break;
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Sound playback not supported');
  }
};

// Enhanced message processing for voice-over with better Nepali
const processMessageForSpeech = (message: string, variant: AlertVariant): string => {
  let processedMessage = message;
  
  // Handle validation errors with better Nepali voice-over
  if (message.toLowerCase().includes('required') || message.toLowerCase().includes('validation')) {
    if (message.toLowerCase().includes('customer')) {
      processedMessage = 'ग्राहक फिल्ड भर्नुपर्छ। कृपया ग्राहक छान्नुहोस्।';
    } else if (message.toLowerCase().includes('factory')) {
      processedMessage = 'कारखाना फिल्ड भर्नुपर्छ। कृपया कारखाना छान्नुहोस्।';
    } else if (message.toLowerCase().includes('measurement')) {
      processedMessage = 'मापन फिल्ड भर्नुपर्छ। कृपया मापन छान्नुहोस्।';
    } else if (message.toLowerCase().includes('catalog')) {
      processedMessage = 'क्याटलग आइटम भर्नुपर्छ। कृपया क्याटलग आइटम छान्नुहोस्।';
    } else {
      processedMessage = 'कृपया सबै आवश्यक फिल्डहरू भर्नुहोस्।';
    }
  }
  
  // Handle success messages with better Nepali
  if (variant === 'success') {
    if (message.toLowerCase().includes('update')) {
      processedMessage = 'अर्डर सफलतापूर्वक अपडेट भयो।';
    } else if (message.toLowerCase().includes('create')) {
      processedMessage = 'अर्डर सफलतापूर्वक सिर्जना भयो।';
    }
  }
  
  return processedMessage;
};

// Voice-over functionality using Web Speech API with better Nepali support
const speakMessage = (message: string, variant: AlertVariant) => {
  try {
    if ('speechSynthesis' in window) {
      // Stop any currently speaking
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(message);
      
      // Configure voice settings for faster Nepali speech
      if (variant === 'success') {
        utterance.rate = 0.8; // Faster for success messages
        utterance.pitch = 1.0; // Normal pitch
        utterance.volume = 1.0; // Full volume
      } else {
        utterance.rate = 0.7; // Faster for error messages
        utterance.pitch = 1.0; // Normal pitch
        utterance.volume = 1.0; // Full volume
      }
      
      // Try to use Nepali voice or fallback to available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Look for Nepali voice first with better detection
      const nepaliVoice = voices.find(voice => 
        voice.lang.includes('ne') || 
        voice.lang.includes('hi') || // Hindi as fallback
        voice.name.toLowerCase().includes('nepali') ||
        voice.name.toLowerCase().includes('hindi') ||
        voice.name.toLowerCase().includes('india') ||
        voice.name.toLowerCase().includes('google') ||
        voice.name.toLowerCase().includes('microsoft')
      );
      
      // Fallback to clear English voice if Nepali not available
      const clearEnglishVoice = voices.find(voice => 
        voice.name.includes('Samantha') ||
        voice.name.includes('Google UK English Female') ||
        voice.name.includes('Microsoft Zira') ||
        voice.name.includes('Alex') ||
        voice.name.includes('Google US English Female')
      );
      
      if (nepaliVoice) {
        utterance.voice = nepaliVoice;
        utterance.lang = 'ne-NP'; // Set Nepali language
      } else if (clearEnglishVoice) {
        utterance.voice = clearEnglishVoice;
        utterance.lang = 'en-US'; // Fallback to English
        // For English fallback, use faster rate
        utterance.rate = 0.6;
      }
      
      // Add event listeners for better control
      utterance.onstart = () => {
        console.log('Speech started');
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
      };
      
      utterance.onerror = (event) => {
        console.log('Speech error:', event);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    console.log('Speech synthesis not supported');
  }
};

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{ msg: string; variant: AlertVariant } | null>(null);
  
  const showAlert = (msg: string, variant: AlertVariant = "destructive") => {
    setAlert({ msg, variant });
    
    // Process message for better voice-over
    const processedMessage = processMessageForSpeech(msg, variant);
    
    // Play appropriate sound based on message content and variant
    if (variant === 'success') {
      if (msg.toLowerCase().includes('update') || msg.toLowerCase().includes('updated')) {
        playSound('update');
      } else {
        playSound('success');
      }
    } else {
      playSound('error');
    }
    
    // Speak the message with voice-over
    speakMessage(processedMessage, variant);
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