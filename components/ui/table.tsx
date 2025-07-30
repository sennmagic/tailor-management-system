"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg shadow-black/5"
    >
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <table
          data-slot="table"
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        />
      </div>
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-gradient-to-r from-muted/40 to-muted/20 border-b border-border/60 sticky top-0 z-10", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("divide-y divide-border/40", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-gradient-to-r from-muted/30 to-muted/10 border-t border-border/60 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "group relative transition-all duration-300 ease-out hover:bg-muted/40 hover:shadow-sm data-[state=selected]:bg-primary/10 data-[state=selected]:shadow-md data-[state=selected]:border-l-2 data-[state=selected]:border-l-primary",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-14 px-6 text-left align-middle font-semibold text-foreground/90 whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] tracking-wide",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-6 align-middle text-foreground/80 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground/80 italic", className)}
      {...props}
    />
  )
}

// Enhanced professional table components
function TableContainer({ 
  className, 
  children,
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative w-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TableToolbar({ 
  className, 
  children,
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-6 border-b border-border/40 bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TablePagination({ 
  className, 
  children,
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-6 border-t border-border/40 bg-gradient-to-r from-muted/20 to-muted/5 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TableEmpty({ 
  className, 
  children,
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center text-muted-foreground/70 space-y-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TableLoading({ 
  className, 
  children,
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-center p-12 text-center text-muted-foreground/70 space-y-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Additional utility components
function TableSearch({ 
  className, 
  placeholder = "Search...",
  ...props 
}: React.ComponentProps<"input"> & { placeholder?: string }) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-2 pl-10 pr-4 text-sm border border-border/50 rounded-lg bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200",
          className
        )}
        {...props}
      />
      <svg
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  )
}

function TableFilter({ 
  className, 
  children,
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 border border-border/50 rounded-lg bg-background/50 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TableActions({ 
  className, 
  children,
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TableStatus({ 
  className, 
  variant = "default",
  children,
  ...props 
}: React.ComponentProps<"span"> & { variant?: "default" | "success" | "warning" | "error" | "info" }) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  }
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableContainer,
  TableToolbar,
  TablePagination,
  TableEmpty,
  TableLoading,
  TableSearch,
  TableFilter,
  TableActions,
  TableStatus,
}
