"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ExternalLink, Plus, Check, X, Pencil, Info } from "lucide-react";

interface LeetCodeCardProps {
    leetcodeUsername: string | null;
    onUsernameSet: (username: string | null) => void;
}

interface LeetCodeStats {
    username: string;
    avatar: string | null;
    ranking: number;
    totalProblems: number;
    solved: { all: number; easy: number; medium: number; hard: number };
    progress: number;
    score: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// LeetCode SVG logo
const LeetCodeLogo = () => (
    <svg viewBox="0 0 95 111" fill="none" className="w-8 h-8">
        <path d="M68.0 79.9L42.3 79.9C37.0 79.9 32.7 75.6 32.7 70.3L32.7 40.8C32.7 35.5 37.0 31.2 42.3 31.2L68.0 31.2C73.3 31.2 77.6 35.5 77.6 40.8L77.6 70.3C77.6 75.6 73.3 79.9 68.0 79.9Z" fill="#FFA116" />
        <path fillRule="evenodd" clipRule="evenodd" d="M54.1 16.1C52.4 14.4 49.7 14.4 48.0 16.1L31.1 33.0C29.4 34.7 29.4 37.4 31.1 39.1C32.8 40.8 35.5 40.8 37.2 39.1L54.1 22.2C55.8 20.5 55.8 17.8 54.1 16.1Z" fill="#B3B3B3" />
        <path fillRule="evenodd" clipRule="evenodd" d="M43.1 72.6C44.5 74.3 47.1 74.5 48.8 73.1L76.4 50.0C78.1 48.6 78.3 46.0 76.9 44.3C75.5 42.6 72.9 42.4 71.2 43.8L43.6 66.9C41.9 68.3 41.7 70.9 43.1 72.6Z" fill="#B3B3B3" />
        <path d="M19.8 48.1L9.0 48.1C7.3 48.1 5.9 49.5 5.9 51.2L5.9 59.9C5.9 61.6 7.3 63.0 9.0 63.0L19.8 63.0C21.5 63.0 22.9 61.6 22.9 59.9L22.9 51.2C22.9 49.5 21.5 48.1 19.8 48.1Z" fill="#FFA116" />
    </svg>
);

const LevelDots = ({ level = 1 }: { level?: number }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3].map(i => (
            <div
                key={i}
                className={`w-3 h-3 rounded-sm transition-colors ${i <= level ? "bg-[#FFA116]" : "bg-gray-200 dark:bg-gray-700"}`}
            />
        ))}
    </div>
);

const DifficultyBar = ({ label, solved, total, color }: { label: string; solved: number; total: number; color: string }) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px] font-medium" style={{ color: "var(--color-text-tertiary, #94a3b8)" }}>
            <span className="font-bold" style={{ color }}>{label}</span>
            <span>{solved} / {total}</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((solved / Math.max(total, 1)) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
            />
        </div>
    </div>
);

export default function LeetCodeCard({ leetcodeUsername, onUsernameSet }: LeetCodeCardProps) {
    const [stats, setStats] = useState<LeetCodeStats | null>(null);
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
            const res = await fetch(`${BACKEND_URL}/api/leetcode-stats/${encodeURIComponent(username)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load stats");
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
        if (leetcodeUsername) fetchStats(leetcodeUsername);
        else setStats(null);
    }, [leetcodeUsername, fetchStats]);

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const trimmed = inputValue.trim();
        if (!trimmed) { setEditError("Username cannot be empty."); return; }
        setIsSaving(true); setEditError(null);
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${BACKEND_URL}/api/user/leetcode`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ leetcode_username: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save");
            onUsernameSet(data.leetcode_username);
            setIsEditing(false);
        } catch (err: any) {
            setEditError(err.message || "Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInputValue(leetcodeUsername || "");
        setEditError(null);
        setIsEditing(true);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditError(null);
    };

    // ── No Username State ─────────────────────────────────────────────────────
    if (!leetcodeUsername) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-dashed border-[#FFA116]/30 bg-[#FFA116]/5 p-6 flex flex-col items-center justify-center gap-3 min-h-[140px]"
            >
                <div className="w-12 h-12 rounded-xl bg-[#FFA116]/10 flex items-center justify-center">
                    <LeetCodeLogo />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-secondary, #94a3b8)" }}>
                    Connect your LeetCode profile
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
                                placeholder="e.g. TEST-1234"
                                className="flex-1 bg-white/5 border border-[#FFA116]/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FFA116]/70"
                            />
                            <button onClick={handleSave} disabled={isSaving}
                                className="w-9 h-9 rounded-lg bg-[#FFA116] hover:bg-[#e5911f] flex items-center justify-center text-black transition-colors disabled:opacity-60">
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
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFA116]/10 hover:bg-[#FFA116]/20 text-[#FFA116] text-sm font-semibold transition-colors">
                        <Plus className="w-4 h-4" /> Add LeetCode Profile
                    </button>
                )}
            </motion.div>
        );
    }

    // ── Loading State ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="rounded-2xl border border-white/10 p-5 animate-pulse" style={{ backgroundColor: "var(--color-background-card, #0f172a)" }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-16 bg-white/10 rounded" />
                    <div className="h-8 w-8 bg-white/10 rounded" />
                </div>
                <div className="h-3 w-24 bg-white/10 rounded mb-2" />
                <div className="h-6 w-16 bg-white/10 rounded mb-4" />
                <div className="h-2 w-full bg-white/10 rounded mb-4" />
                <div className="flex gap-4">
                    <div className="h-10 flex-1 bg-white/10 rounded" />
                    <div className="h-10 flex-1 bg-white/10 rounded" />
                </div>
            </div>
        );
    }

    // ── Error State ───────────────────────────────────────────────────────────
    if (statsError) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex items-center justify-between"
            >
                <div>
                    <p className="text-sm font-bold text-red-400">Could not load LeetCode stats</p>
                    <p className="text-xs text-red-400/60 mt-0.5">{statsError}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchStats(leetcodeUsername!)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-colors">
                        Retry
                    </button>
                    <button onClick={handleEditClick}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 font-semibold transition-colors">
                        Edit username
                    </button>
                </div>
            </motion.div>
        );
    }

    // ── Stats Card (main) ─────────────────────────────────────────────────────
    const level = stats ? (stats.solved.hard > 20 ? 3 : stats.solved.medium > 50 ? 2 : 1) : 1;
    const totalEasy = Math.round((stats?.totalProblems ?? 3000) * 0.33);
    const totalMedium = Math.round((stats?.totalProblems ?? 3000) * 0.44);
    const totalHard = Math.round((stats?.totalProblems ?? 3000) * 0.23);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-2xl border overflow-hidden"
            style={{
                borderColor: "var(--color-border-subtle, rgba(255,255,255,0.08))",
                backgroundColor: "var(--color-background-card, #0f172a)",
            }}
        >
            {/* Header strip */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                    <LevelDots level={level} />
                    <span className="text-[11px] uppercase font-black tracking-[0.18em] text-[#FFA116]/60">Level</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Refresh */}
                    <button
                        onClick={() => fetchStats(leetcodeUsername!, true)}
                        disabled={refreshing}
                        title="Refresh stats"
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    {/* Edit username */}
                    <button onClick={handleEditClick} title="Edit username"
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {/* Visit LeetCode */}
                    <a
                        href={`https://leetcode.com/u/${leetcodeUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open LeetCode profile"
                        className="w-7 h-7 rounded-lg bg-[#FFA116]/10 hover:bg-[#FFA116]/25 flex items-center justify-center text-[#FFA116]/60 hover:text-[#FFA116] transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <LeetCodeLogo />
                </div>
            </div>

            {/* Edit username inline */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-3 overflow-hidden"
                    >
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleSave(e as any); if (e.key === "Escape") handleCancel(e as any); }}
                                placeholder="LeetCode username…"
                                className="flex-1 bg-white/5 border border-[#FFA116]/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FFA116]/70 transition-colors"
                            />
                            <button onClick={handleSave} disabled={isSaving}
                                className="w-8 h-8 rounded-lg bg-[#FFA116] hover:bg-[#e5911f] flex items-center justify-center text-black transition-colors disabled:opacity-60">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancel}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {editError && <p className="text-xs text-red-400 mt-1.5">{editError}</p>}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pb-5">
                {/* Username */}
                <p className="text-[13px] font-bold mb-0.5" style={{ color: "var(--color-text-tertiary, #94a3b8)" }}>
                    {stats?.username ?? leetcodeUsername}
                </p>

                {/* Goal / Progress row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black" style={{ color: "var(--color-text-primary, #f1f5f9)" }}>Goal</span>
                        <Info className="w-3.5 h-3.5 text-white/30" />
                    </div>
                    <span className="text-sm font-black text-[#FFA116]">
                        {stats ? `${stats.progress}%` : "—"}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden mb-5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(stats?.progress ?? 0, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-[#FFA116] to-[#ffcd6b]"
                    />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="rounded-xl bg-white/5 px-4 py-3 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-4 h-4 text-white/30">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-black text-white/30">Solved</span>
                        </div>
                        <p className="text-lg font-black leading-tight" style={{ color: "var(--color-text-primary, #f1f5f9)" }}>
                            {stats?.solved.all ?? 0}
                            <span className="text-sm font-semibold text-white/30"> / {stats?.totalProblems ?? "—"}</span>
                        </p>
                    </div>
                    <div className="rounded-xl bg-white/5 px-4 py-3 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-4 h-4 text-white/30">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                    <polyline points="17 6 23 6 23 12" />
                                </svg>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-black text-white/30">Score</span>
                        </div>
                        <p className="text-lg font-black leading-tight" style={{ color: "var(--color-text-primary, #f1f5f9)" }}>
                            {stats?.score ?? 0}
                            <span className="text-sm font-semibold text-white/30"> pts</span>
                        </p>
                    </div>
                </div>

                {/* Difficulty breakdown */}
                <div className="flex flex-col gap-2.5 border-t border-white/5 pt-4">
                    <DifficultyBar label="Easy" solved={stats?.solved.easy ?? 0} total={totalEasy} color="#00b8a3" />
                    <DifficultyBar label="Medium" solved={stats?.solved.medium ?? 0} total={totalMedium} color="#FFA116" />
                    <DifficultyBar label="Hard" solved={stats?.solved.hard ?? 0} total={totalHard} color="#ef4743" />
                </div>

                {/* Footer: ranking */}
                {stats && stats.ranking > 0 && (
                    <p className="mt-4 text-[11px] text-white/25 font-semibold text-right">
                        Global Rank: #{stats.ranking.toLocaleString()}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
