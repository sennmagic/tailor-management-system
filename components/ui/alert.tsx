import * as React from "react"
import { cn } from "@/lib/utils"
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Bell, Volume2, VolumeX } from "lucide-react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  title?: string;
  description?: string;
  dismissible?: boolean;
  autoDismiss?: number; // milliseconds
  onDismiss?: () => void;
  showProgress?: boolean;
  sound?: boolean;
  priority?: "low" | "medium" | "high";
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline";
  };
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ 
    className, 
    variant = "default", 
    title,
    description,
    dismissible = false,
    autoDismiss,
    onDismiss,
    showProgress = false,
    sound = false,
    priority = "medium",
    action,
    children,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const [progress, setProgress] = React.useState(100);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(false);
    const progressRef = React.useRef<HTMLDivElement>(null);
    const alertRef = React.useRef<HTMLDivElement>(null);

    // Sound effect on mount
    React.useEffect(() => {
      if (sound && !isMuted && isVisible) {
        // Create audio context for notification sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    }, [sound, isMuted, isVisible]);

    // Auto dismiss functionality
    React.useEffect(() => {
      if (autoDismiss && isVisible && !isHovered) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismiss);

        return () => clearTimeout(timer);
      }
    }, [autoDismiss, isVisible, isHovered]);

    // Progress bar animation
    React.useEffect(() => {
      if (showProgress && autoDismiss && isVisible && !isHovered) {
        const startTime = Date.now();
        const duration = autoDismiss;

        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
          setProgress(remaining);

          if (remaining > 0 && isVisible && !isHovered) {
            requestAnimationFrame(updateProgress);
          }
        };

        requestAnimationFrame(updateProgress);
      }
    }, [showProgress, autoDismiss, isVisible, isHovered]);

    const handleDismiss = () => {
      setIsVisible(false);
      setTimeout(() => {
        onDismiss?.();
      }, 500); // Wait for exit animation
    };

    // Icon mapping
    const getIcon = () => {
      switch (variant) {
        case "destructive":
          return <AlertCircle className="w-5 h-5" />;
        case "success":
          return <CheckCircle className="w-5 h-5" />;
        case "warning":
          return <AlertTriangle className="w-5 h-5" />;
        case "info":
          return <Info className="w-5 h-5" />;
        default:
          return <Bell className="w-5 h-5" />;
      }
    };

    // Priority styles
    const getPriorityStyles = () => {
      switch (priority) {
        case "high":
          return "border-l-4 border-l-current shadow-lg shadow-current/20";
        case "medium":
          return "border-l-2 border-l-current shadow-md shadow-current/10";
        case "low":
          return "border-l border-l-current shadow-sm shadow-current/5";
        default:
          return "border-l-2 border-l-current shadow-md shadow-current/10";
      }
    };

    // Variant styles
    const getVariantStyles = () => {
      switch (variant) {
        case "destructive":
          return {
            container: "bg-gradient-to-r from-red-50/95 to-red-100/95 border-red-200/60 text-red-800 backdrop-blur-md shadow-xl shadow-red-500/15",
            icon: "text-red-600",
            progress: "bg-gradient-to-r from-red-500 to-red-600",
            title: "text-red-900",
            description: "text-red-700",
            action: "bg-red-600 hover:bg-red-700 text-white"
          };
        case "success":
          return {
            container: "bg-gradient-to-r from-green-50/95 to-green-100/95 border-green-200/60 text-green-800 backdrop-blur-md shadow-xl shadow-green-500/15",
            icon: "text-green-600",
            progress: "bg-gradient-to-r from-green-500 to-green-600",
            title: "text-green-900",
            description: "text-green-700",
            action: "bg-green-600 hover:bg-green-700 text-white"
          };
        case "warning":
          return {
            container: "bg-gradient-to-r from-yellow-50/95 to-yellow-100/95 border-yellow-200/60 text-yellow-800 backdrop-blur-md shadow-xl shadow-yellow-500/15",
            icon: "text-yellow-600",
            progress: "bg-gradient-to-r from-yellow-500 to-yellow-600",
            title: "text-yellow-900",
            description: "text-yellow-700",
            action: "bg-yellow-600 hover:bg-yellow-700 text-white"
          };
        case "info":
          return {
            container: "bg-gradient-to-r from-blue-50/95 to-blue-100/95 border-blue-200/60 text-blue-800 backdrop-blur-md shadow-xl shadow-blue-500/15",
            icon: "text-blue-600",
            progress: "bg-gradient-to-r from-blue-500 to-blue-600",
            title: "text-blue-900",
            description: "text-blue-700",
            action: "bg-blue-600 hover:bg-blue-700 text-white"
          };
        default:
          return {
            container: "bg-gradient-to-r from-gray-50/95 to-gray-100/95 border-gray-200/60 text-gray-800 backdrop-blur-md shadow-xl shadow-gray-500/15",
            icon: "text-gray-600",
            progress: "bg-gradient-to-r from-gray-500 to-gray-600",
            title: "text-gray-900",
            description: "text-gray-700",
            action: "bg-gray-600 hover:bg-gray-700 text-white"
          };
      }
    };

    const styles = getVariantStyles();

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative w-full rounded-xl border px-4 py-4 text-sm transition-all duration-500 ease-out",
          "transform animate-in slide-in-from-top-4 fade-in-0 zoom-in-95",
          "hover:shadow-2xl hover:scale-[1.02] hover:border-opacity-80 hover:rotate-0.5",
          "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-current",
          getPriorityStyles(),
          styles.container,
          className
        )}
        {...props}
      >
        {/* Progress Bar */}
        {showProgress && autoDismiss && (
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-200/50 rounded-t-xl overflow-hidden">
            <div
              ref={progressRef}
              className={cn("h-full transition-all duration-100 ease-linear rounded-full", styles.progress)}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />

        <div className="flex items-start gap-4 relative z-10">
          {/* Icon with animation */}
          <div className={cn("flex-shrink-0 mt-0.5 animate-pulse", styles.icon)}>
            <div className="relative">
              {getIcon()}
              <div className="absolute inset-0 bg-current rounded-full opacity-20 animate-ping" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={cn("font-bold mb-2 text-base", styles.title)}>
                {title}
              </h4>
            )}
            {description && (
              <p className={cn("text-sm leading-relaxed", styles.description)}>
                {description}
              </p>
            )}
            {children && !description && (
              <div className="text-sm leading-relaxed">
                {children}
              </div>
            )}
            
            {/* Action Button */}
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2",
                    styles.action
                  )}
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2">
            {/* Sound Toggle */}
            {sound && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "flex-shrink-0 p-1.5 rounded-md transition-all duration-200",
                  "hover:bg-black/10 active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current",
                  styles.icon
                )}
                aria-label={isMuted ? "Unmute alerts" : "Mute alerts"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* Dismiss Button */}
            {dismissible && (
              <button
                onClick={handleDismiss}
                className={cn(
                  "flex-shrink-0 p-1.5 rounded-md transition-all duration-200",
                  "hover:bg-black/10 active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current",
                  styles.icon
                )}
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 right-2 w-2 h-2 bg-current rounded-full opacity-30 animate-bounce" />
          <div className="absolute bottom-2 left-2 w-1 h-1 bg-current rounded-full opacity-20 animate-pulse" />
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";

// Enhanced Alert Provider for managing multiple alerts
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Hook for creating alerts programmatically
export const useAlert = () => {
  const [alerts, setAlerts] = React.useState<Array<{
    id: string;
    variant: AlertProps['variant'];
    title?: string;
    description?: string;
    autoDismiss?: number;
    priority?: AlertProps['priority'];
    sound?: boolean;
    action?: AlertProps['action'];
  }>>([]);

  const addAlert = React.useCallback((alert: {
    variant?: AlertProps['variant'];
    title?: string;
    description?: string;
    autoDismiss?: number;
    priority?: AlertProps['priority'];
    sound?: boolean;
    action?: AlertProps['action'];
  }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts(prev => [...prev, { id, ...alert }]);
    return id;
  }, []);

  const removeAlert = React.useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  return { alerts, addAlert, removeAlert };
}; 