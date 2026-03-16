"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import Tooltip from "@/components/ui/Tooltip";

type Theme = "light" | "dark" | "system";

const CYCLE: Theme[] = ["system", "light", "dark"];

const LABELS: Record<Theme, string> = {
  system: "Following System (click for Light)",
  light: "Light Mode (click for Dark)",
  dark: "Dark Mode (click for System)",
};

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  const current = (theme as Theme) ?? "system";
  const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

  return (
    <Tooltip content={LABELS[current]} position="bottom">
      <button
        onClick={() => setTheme(next)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
        aria-label="Toggle theme"
      >
        {/* System */}
        <Monitor
          className={`h-[1.2rem] w-[1.2rem] transition-all duration-200 ${
            current === "system" ? "scale-100 opacity-100" : "scale-0 opacity-0 absolute"
          }`}
        />
        {/* Light */}
        <Sun
          className={`h-[1.2rem] w-[1.2rem] transition-all duration-200 ${
            current === "light" ? "scale-100 opacity-100" : "scale-0 opacity-0 absolute"
          }`}
        />
        {/* Dark */}
        <Moon
          className={`h-[1.2rem] w-[1.2rem] transition-all duration-200 ${
            current === "dark" ? "scale-100 opacity-100" : "scale-0 opacity-0 absolute"
          }`}
        />
      </button>
    </Tooltip>
  );
}
