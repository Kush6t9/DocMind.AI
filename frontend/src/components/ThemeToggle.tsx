import React, { useState, useEffect, useRef } from "react";
import { Sun, Moon, Laptop, ChevronDown } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    const saved = localStorage.getItem("docmind_theme_mode");
    return (saved as "light" | "dark" | "system") || "dark"; // Default to dark/night
  });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = () => {
      if (theme === "light") {
        root.classList.add("light");
        root.classList.remove("dark");
      } else if (theme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        // System preference
        const isDarkSystem = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (isDarkSystem) {
          root.classList.add("dark");
          root.classList.remove("light");
        } else {
          root.classList.add("light");
          root.classList.remove("dark");
        }
      }
    };

    applyTheme();
    localStorage.setItem("docmind_theme_mode", theme);

    // Watch system changes if in system mode
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  // Close dropdown on click outside
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const themeOptions = [
    { mode: "light", label: "Light", icon: Sun },
    { mode: "dark", label: "Night", icon: Moon },
    { mode: "system", label: "System", icon: Laptop },
  ] as const;

  const ActiveIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Laptop;

  return (
    <div className="relative" ref={dropdownRef} id="theme-toggle-wrapper">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-surface hover:bg-bg-surface-raised border border-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer select-none"
        title="Change theme mode"
      >
        <ActiveIcon className="w-3.5 h-3.5 text-sky-400" />
        <span className="capitalize text-[11px] font-medium hidden sm:inline">{theme === "dark" ? "Night" : theme}</span>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      <AnimateDropdown isOpen={isOpen}>
        <div className="absolute right-0 mt-2 w-32 rounded-2xl bg-bg-surface border border-slate-800 p-1.5 shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-md">
          {themeOptions.map((opt) => {
            const OptIcon = opt.icon;
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  isSelected
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    : "text-slate-400 hover:text-white hover:bg-bg-surface-raised border border-transparent"
                }`}
              >
                <OptIcon className={`w-3.5 h-3.5 ${isSelected ? "text-sky-400" : "text-slate-500"}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </AnimateDropdown>
    </div>
  );
}

// Simple internal transition layout
function AnimateDropdown({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  if (!isOpen) return null;
  return children;
}
