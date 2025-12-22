import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-[#fafafa] w-64 p-2 h-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  label?: string
}

export function SidebarGroup({ className, children, label, ...props }: SidebarGroupProps) {
  return (
    <div className={cn("flex flex-col gap-1 pb-2", className)} {...props}>
      {label && (
        <div className="h-8 flex items-center px-2 opacity-70">
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
      )}
      {children}
    </div>
  )
}

interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  active?: boolean
  children: React.ReactNode
}

export function SidebarItem({ className, icon, active, children, ...props }: SidebarItemProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 h-8 px-2 rounded-lg text-sm w-full text-left transition-colors",
        active 
          ? "bg-[#1b5858] text-white" 
          : "text-foreground hover:bg-muted",
        className
      )}
      {...props}
    >
      {icon && <span className="size-4 flex items-center justify-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  )
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function SidebarFooter({ className, children, ...props }: SidebarFooterProps) {
  return (
    <div className={cn("mt-auto pt-2", className)} {...props}>
      {children}
    </div>
  )
}

