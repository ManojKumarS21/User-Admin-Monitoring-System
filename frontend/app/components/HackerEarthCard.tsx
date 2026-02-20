"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ExternalLink, Plus, Check, X, Pencil, Trophy } from "lucide-react";

interface HackerEarthCardProps {
    hackerearthUsername: string | null;
    onUsernameSet: (username: string | null) => void;
}

interface HackerEarthStats {
    username: string;
    fullName: string;
    avatar: string | null;
    score: number;
    location: string;
    badges: { name: string; stars: number; icon: string; points: number }[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// HackerEarth SVG logo (Blue #3273DC)
const HackerEarthLogo = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#3273DC" />
        <path d="M16 8H8V16H16V8ZM15 15H9V9H15V15Z" fill="white" />
        <path d="M7 11V13H8V11H7Z" fill="white" />
        <path d="M16 11V13H17V11H16Z" fill="white" />
    </svg>
);

const BadgeItem = ({ badge }: { badge: any }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            {badge.icon ? (
                <img src={badge.icon} alt={badge.name} className="w-5 h-5 object-contain" />
            ) : (
                <Trophy className="w-3.5 h-3.5 text-[#3273DC]" />
            )}
            <span className="text-xs font-semibold text-white/80">{badge.name}</span>
        </div>
        <span className="text-[10px] font-bold text-white/40">{badge.points} pts</span>
    </div>
);

export default function HackerEarthCard({ hackerearthUsername, onUsernameSet }: HackerEarthCardProps) {
    const [stats, setStats] = useState<HackerEarthStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const fetchStats = useCallback(async (username: string, silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setStatsError(null);
        try {
            const res = await fetch(`${BACKEND_URL}/api/hackerearth-stats/${encodeURIComponent(username)}`);
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Error ${res.status}: ${errorText.substring(0, 50)}`);
            }
            const data = await res.json();
            setStats(data);
        } catch (err: any) {
            setStatsError(err.message || "Could not load stats");
            setStats(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (hackerearthUsername) fetchStats(hackerearthUsername);
        else setStats(null);
    }, [hackerearthUsername, fetchStats]);

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const trimmed = inputValue.trim().replace(/^@/, ""); // Allow @ prefix but store without it
        if (!trimmed) { setEditError("Username cannot be empty."); return; }
        setIsSaving(true); setEditError(null);
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${BACKEND_URL}/api/user/hackerearth`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ hackerearth_username: trimmed }),
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error("Failed to save");
            }
            const data = await res.json();
            onUsernameSet(data.hackerearth_username);
            setIsEditing(false);
        } catch (err: any) {
            setEditError(err.message || "Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInputValue(hackerearthUsername || "");
        setEditError(null);
        setIsEditing(true);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditError(null);
    };

    if (!hackerearthUsername) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-dashed border-[#3273DC]/30 bg-[#3273DC]/5 p-6 flex flex-col items-center justify-center gap-3 min-h-[140px]"
            >
                <div className="w-12 h-12 rounded-xl bg-[#3273DC]/10 flex items-center justify-center">
                    <HackerEarthLogo />
                </div>
                <p className="text-sm font-semibold text-slate-400">
                    Connect your HackerEarth profile
                </p>

                {isEditing ? (
                    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                        <div className="flex items-center gap-2 w-full">
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleSave(e as any); if (e.key === "Escape") handleCancel(e as any); }}
                                placeholder="Username (e.g. ABCD...)"
                                className="flex-1 bg-white/5 border border-[#3273DC]/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#3273DC]/70"
                            />
                            <button onClick={handleSave} disabled={isSaving}
                                className="w-9 h-9 rounded-lg bg-[#3273DC] hover:bg-[#2a62c1] flex items-center justify-center text-white transition-colors disabled:opacity-60">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancel}
                                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {editError && <p className="text-xs text-red-400 self-start">{editError}</p>}
                    </div>
                ) : (
                    <button onClick={handleEditClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3273DC]/10 hover:bg-[#3273DC]/20 text-[#3273DC] text-sm font-semibold transition-colors">
                        <Plus className="w-4 h-4" /> Add HackerEarth Profile
                    </button>
                )}
            </motion.div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/10 p-5 animate-pulse bg-slate-900/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-16 bg-white/10 rounded" />
                    <div className="h-8 w-8 bg-white/10 rounded" />
                </div>
                <div className="h-3 w-24 bg-white/10 rounded mb-2" />
                <div className="h-6 w-16 bg-white/10 rounded mb-4" />
                <div className="h-2 w-full bg-white/10 rounded mb-4" />
            </div>
        );
    }

    if (statsError) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex items-center justify-between"
            >
                <div>
                    <p className="text-sm font-bold text-red-400">Error: {statsError}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchStats(hackerearthUsername!)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-colors">
                        Retry
                    </button>
                    <button onClick={handleEditClick}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 font-semibold transition-colors">
                        Edit
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden"
        >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] uppercase font-black tracking-[0.18em] text-[#3273DC]/60">HackerEarth</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => fetchStats(hackerearthUsername!, true)} disabled={refreshing}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    <button onClick={handleEditClick}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <a href={`https://www.hackerearth.com/@${hackerearthUsername}`} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-[#3273DC]/10 hover:bg-[#3273DC]/25 flex items-center justify-center text-[#3273DC]/60 hover:text-[#3273DC] transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <HackerEarthLogo />
                </div>
            </div>

            <AnimatePresence>
                {isEditing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-5 pb-3">
                        <div className="flex items-center gap-2">
                            <input autoFocus type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Username"
                                className="flex-1 bg-white/5 border border-[#3273DC]/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#3273DC]/70" />
                            <button onClick={handleSave} className="w-8 h-8 rounded-lg bg-[#3273DC] flex items-center justify-center text-white">
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pb-5">
                <div className="flex items-center gap-3 mb-4">
                    {stats?.avatar && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/5">
                            <img src={stats.avatar} alt={stats.fullName} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-bold text-white leading-none mb-1">
                            {stats?.fullName}
                        </p>
                        <p className="text-[12px] font-bold text-slate-500">
                            @{hackerearthUsername}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-5">
                    <div className="rounded-xl bg-white/5 px-4 py-3 flex flex-col gap-0.5 border border-white/5">
                        <span className="text-[10px] uppercase tracking-widest font-black text-white/30">Current Score</span>
                        <p className="text-2xl font-black text-white">{stats?.score || 0}</p>
                    </div>
                </div>

                {stats?.badges && stats.badges.length > 0 && (
                    <div className="border-t border-white/5 pt-4">
                        <p className="text-[10px] uppercase tracking-widest font-black text-white/30 mb-3">Recent Badges</p>
                        <div className="flex flex-col gap-3">
                            {stats.badges.map((badge, idx) => (
                                <BadgeItem key={idx} badge={badge} />
                            ))}
                        </div>
                    </div>
                )}

                {stats?.location && stats.location !== "Unknown" && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Location: <span className="text-white/60">{stats.location}</span></p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
