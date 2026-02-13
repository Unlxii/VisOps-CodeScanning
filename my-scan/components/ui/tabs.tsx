"use client"

import * as React from "react"
import { createContext, useContext, useState } from "react"

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const Tabs = ({ defaultValue, className, children }: { defaultValue: string, className?: string, children: React.ReactNode }) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 dark:text-slate-400 ${className || ""}`}>
    {children}
  </div>
)

const TabsTrigger = ({ value, className, children }: { value: string, className?: string, children: React.ReactNode }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger used outside Tabs");

  const isSelected = context.value === value;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
        ${isSelected ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50" : "hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100"}
        ${className || ""}`}
      onClick={() => context.onValueChange(value)}
      type="button"
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, className, children }: { value: string, className?: string, children: React.ReactNode }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent used outside Tabs");

  if (context.value !== value) return null;

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className || ""}`}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
