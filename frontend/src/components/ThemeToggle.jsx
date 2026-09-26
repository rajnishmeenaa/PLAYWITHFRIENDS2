import React from "react";
import { useTheme } from "../lib/theme";
import { Sun, Moon } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-200 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-colors shadow-sm ${className}`}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle Theme"
      data-testid="theme-toggle-btn"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 180 : 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {theme === "dark" ? (
          <Sun size={18} weight="fill" className="text-amber-400" />
        ) : (
          <Moon size={18} weight="fill" className="text-zinc-700" />
        )}
      </motion.div>
    </button>
  );
}
