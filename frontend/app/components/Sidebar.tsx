"use client";

import React from "react";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    FileBarChart,
    ShieldCheck,
    Zap
} from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
    onLogout: () => void;
    activeUsers: number;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, activeUsers }) => {
    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", active: true },
        { icon: Users, label: "User Management" },
        { icon: FileBarChart, label: "Analytics" },
        { icon: Settings, label: "Settings" },
    ];

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-72 bg-background-card backdrop-blur-3xl border-r border-border-subtle flex flex-col h-screen sticky top-0 z-50 overflow-hidden"
        >
            {/* Brand Logo */}
            <div className="p-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-glow shadow-brand-primary/20">
                    <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight">VIGILANT</h1>
                    <p className="text-[10px] text-brand-primary font-bold uppercase tracking-[0.2em]">Admin Suite</p>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-4 mt-4 space-y-2">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${item.active
                                ? "bg-brand-primary/10 text-white border border-brand-primary/20 shadow-glow shadow-brand-primary/5"
                                : "text-slate-500 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${item.active ? "text-brand-primary" : "group-hover:text-brand-primary"} transition-colors`} />
                        <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                        {item.label === "Overview" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />}
                    </button>
                ))}
            </nav>

            {/* System Status Card */}
            <div className="px-6 mb-8">
                <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/20 rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3">
                        <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                    </div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Live Activity</p>
                    <h3 className="text-2xl font-black text-white mb-2">{activeUsers} <span className="text-xs text-slate-500 font-normal">Active</span></h3>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "65%" }}
                            className="h-full bg-brand-primary shadow-glow shadow-brand-primary/50"
                        />
                    </div>
                </div>
            </div>

            {/* Logout Footer */}
            <div className="p-6 border-t border-border-subtle">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all font-semibold text-sm group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Log Out
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
