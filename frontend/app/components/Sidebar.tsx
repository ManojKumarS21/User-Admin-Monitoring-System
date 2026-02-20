"use client";

import React, { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    FileBarChart,
    ShieldCheck,
    Zap,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
    onLogout: () => void;
    activeUsers: number;
    onVisibilityChange?: (visible: boolean) => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, activeUsers, onVisibilityChange, activeTab, onTabChange }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        onVisibilityChange?.(isVisible);
    }, [isVisible, onVisibilityChange]);

    const [isHovering, setIsHovering] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
        { icon: FileBarChart, label: "Analytics", id: "analytics" },
        { icon: Settings, label: "Settings", id: "settings" },
    ];

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Show sidebar when cursor is within 50px of left edge
            if (e.clientX <= 50) {
                setIsVisible(true);
            } else if (e.clientX > 320 && !isHovering) {
                // Hide sidebar when cursor moves away (320px = sidebar width + buffer)
                setIsVisible(false);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [isHovering]);

    return (
        <>
            {/* Trigger Area Indicator */}
            <motion.div
                className="fixed left-0 top-0 h-full w-1 z-40 bg-gradient-to-r from-brand-primary/50 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: isVisible ? 0 : 0.3 }}
                transition={{ duration: 0.3 }}
            />

            {/* Auto-hide Sidebar */}
            <AnimatePresence>
                {isVisible && (
                    <motion.aside
                        initial={{ x: -288 }}
                        animate={{ x: 0 }}
                        exit={{ x: -288 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        className="fixed left-0 top-0 w-72 backdrop-blur-3xl border-r flex flex-col h-screen z-50 overflow-hidden shadow-[20px_0_50px_-15px_rgba(0,0,0,0.3)]"
                        style={{
                            backgroundColor: "var(--color-background-card)",
                            borderColor: "var(--color-border-subtle)",
                            opacity: 0.98
                        }}
                    >
                        {/* Glowing Background Accent */}
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-secondary/10 rounded-full blur-[100px] pointer-events-none" />
                        {/* Brand Logo - Amypo Technologies */}
                        <div className="p-8 flex flex-col gap-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-black to-zinc-800 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] transform rotate-3 hover:rotate-0 transition-all duration-500 group relative overflow-hidden">
                                    <span className="text-white text-3xl font-black italic tracking-tighter group-hover:scale-110 transition-transform relative z-10">A</span>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-2xl font-black tracking-tighter italic leading-tight" style={{ color: "var(--color-text-primary)" }}>
                                        <span className="text-black dark:text-white">Amy</span>
                                        <span className="text-[#22C55E] drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">po</span>
                                    </h1>
                                    <p className="text-[10px] text-brand-primary font-black uppercase tracking-[0.3em] opacity-60">Technologies</p>
                                </div>
                            </div>
                            <div className="h-[1px] w-full bg-gradient-to-r from-brand-primary/30 via-brand-primary/10 to-transparent" />
                        </div>

                        {/* Main Navigation */}
                        <nav className="flex-1 px-4 mt-2 space-y-1 relative z-10">
                            {menuItems.map((item, index) => {
                                const isActive = activeTab === item.id;
                                return (
                                    <motion.button
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 + 0.2 }}
                                        onClick={() => onTabChange(item.id)}
                                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden ${isActive
                                            ? "bg-brand-primary/10 mb-2"
                                            : "hover:bg-brand-primary/5 hover:translate-x-1"
                                            }`}
                                        style={{ color: isActive ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}
                                    >
                                        <div className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-brand-primary/60 group-hover:text-brand-primary group-hover:bg-brand-primary/10"
                                            }`}>
                                            <item.icon className="w-4.5 h-4.5" />
                                        </div>
                                        <span className={`relative z-10 text-sm font-bold tracking-wide transition-all ${isActive ? "scale-105" : "group-hover:text-brand-primary"}`}>{item.label}</span>

                                        {isActive && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </nav>

                        {/* System Status Card */}
                        <div className="px-6 mb-8 relative z-10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="bg-gradient-to-br from-brand-primary/10 via-brand-primary/5 to-transparent rounded-[2.5rem] p-6 border border-white/5 relative overflow-hidden group hover:border-brand-primary/20 transition-colors duration-500"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] mb-2 opacity-50" style={{ color: "var(--color-text-tertiary)" }}>System Hub</p>
                                <h3 className="text-3xl font-black mb-1 flex items-baseline gap-2" style={{ color: "var(--color-text-primary)" }}>
                                    {activeUsers}
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Online</span>
                                </h3>

                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter opacity-50">
                                        <span>Capacity</span>
                                        <span>{Math.min(activeUsers * 10, 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(activeUsers * 10, 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Logout Footer */}
                        <div className="p-6 border-t border-white/5 relative z-10">
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-4 px-5 py-4 text-red-400 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all duration-300 font-bold text-sm group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                <span>Sign Out</span>
                            </button>
                        </div>

                        {/* Interactive Edge Indicator */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-32 bg-gradient-to-b from-transparent via-brand-primary/40 to-transparent rounded-l-full opacity-50" />
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
