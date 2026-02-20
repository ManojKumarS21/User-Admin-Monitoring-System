"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl border transition-all duration-300 group"
            style={{
                backgroundColor: theme === "light" ? "rgba(99, 102, 241, 0.1)" : "rgba(255, 255, 255, 0.05)",
                borderColor: theme === "light" ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.1)",
                color: theme === "light" ? "#6366f1" : "#cbd5e1"
            }}
            aria-label="Toggle theme"
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute inset-0 transition-all duration-300 ${theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"
                        }`}
                />
                <Moon
                    className={`absolute inset-0 transition-all duration-300 ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                        }`}
                />
            </div>
        </button>
    );
}
