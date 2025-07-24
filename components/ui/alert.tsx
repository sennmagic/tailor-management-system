import * as React from "react"
import { cn } from "@/lib/utils"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success";
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "w-full rounded border px-4 py-3 text-sm",
          variant === "destructive"
            ? "bg-red-50 border-red-400 text-red-800"
            : variant === "success"
            ? "bg-green-50 border-green-400 text-green-800"
            : "bg-gray-50 border-gray-200 text-gray-800",
          className
        )}
        {...props}
      />
    )
  }
)
Alert.displayName = "Alert" 