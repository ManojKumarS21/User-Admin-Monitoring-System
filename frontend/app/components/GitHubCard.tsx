"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ExternalLink, Plus, Check, X, Pencil, Github, Users, BookOpen, MapPin, Building2, Link as LinkIcon } from "lucide-react";

interface GitHubCardProps {
    githubUsername: string | null;
    onUsernameSet: (username: string | null) => void;
}

interface GitHubStats {
    username: string;
    fullName: string;
    avatar: string;
    bio: string;
    repos: number;
    followers: number;
    following: number;
    location: string;
    blog: string;
    company: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function GitHubCard({ githubUsername, onUsernameSet }: GitHubCardProps) {
    const [stats, setStats] = useState<GitHubStats | null>(null);
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
            const res = await fetch(`${BACKEND_URL}/api/github-stats/${encodeURIComponent(username)}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Error ${res.status}`);
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
        if (githubUsername) fetchStats(githubUsername);
        else setStats(null);
    }, [githubUsername, fetchStats]);

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const trimmed = inputValue.trim().replace(/^@/, "");
        if (!trimmed) { setEditError("Username cannot be empty."); return; }
        setIsSaving(true); setEditError(null);
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${BACKEND_URL}/api/user/github`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ github_username: trimmed }),
            });
            if (!res.ok) throw new Error("Failed to save");
            const data = await res.json();
            onUsernameSet(data.github_username);
            setIsEditing(false);
        } catch (err: any) {
            setEditError(err.message || "Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInputValue(githubUsername || "");
        setEditError(null);
        setIsEditing(true);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
        setEditError(null);
    };

    if (!githubUsername) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 flex flex-col items-center justify-center gap-3 min-h-[140px]"
            >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Github className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-400">Connect your GitHub profile</p>

                {isEditing ? (
                    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                        <div className="flex items-center gap-2 w-full">
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleSave(e as any); if (e.key === "Escape") handleCancel(e as any); }}
                                placeholder="GitHub Username"
                                className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                            />
                            <button onClick={handleSave} disabled={isSaving}
                                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-60">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancel}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {editError && <p className="text-xs text-red-400 self-start">{editError}</p>}
                    </div>
                ) : (
                    <button onClick={handleEditClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors">
                        <Plus className="w-4 h-4" /> Add GitHub Profile
                    </button>
                )}
            </motion.div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/10 p-5 animate-pulse bg-slate-900/50 min-h-[140px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-16 bg-white/10 rounded" />
                    <div className="h-8 w-8 bg-white/10 rounded" />
                </div>
                <div className="flex gap-3 mb-4">
                    <div className="h-10 w-10 bg-white/10 rounded-lg" />
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-white/10 rounded" />
                        <div className="h-3 w-16 bg-white/10 rounded" />
                    </div>
                </div>
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
                    <button onClick={() => fetchStats(githubUsername!)}
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
                    <span className="text-[11px] uppercase font-black tracking-[0.18em] text-white/40">GitHub</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => fetchStats(githubUsername!, true)} disabled={refreshing}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    <button onClick={handleEditClick}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <a href={`https://github.com/${githubUsername}`} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <Github className="w-8 h-8 text-white" />
                </div>
            </div>

            <AnimatePresence>
                {isEditing && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-5 pb-3">
                        <div className="flex items-center gap-2">
                            <input autoFocus type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Username"
                                className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/40" />
                            <button onClick={handleSave} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pb-5">
                <div className="flex items-center gap-3 mb-4">
                    {stats?.avatar && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                            <img src={stats.avatar} alt={stats.fullName} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-bold text-white leading-none mb-1">
                            {stats?.fullName}
                        </p>
                        <p className="text-[12px] font-bold text-slate-500">
                            @{githubUsername}
                        </p>
                    </div>
                </div>

                {stats?.bio && (
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                        {stats.bio}
                    </p>
                )}

                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-xl bg-white/5 px-3 py-2 border border-white/5 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <BookOpen className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] uppercase tracking-wider font-black text-white/20">Repos</span>
                        </div>
                        <p className="text-lg font-black text-white leading-none">{stats?.repos || 0}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 px-3 py-2 border border-white/5 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] uppercase tracking-wider font-black text-white/20">Fol</span>
                        </div>
                        <p className="text-lg font-black text-white leading-none">{stats?.followers || 0}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 px-3 py-2 border border-white/5 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] uppercase tracking-wider font-black text-white/20">Ing</span>
                        </div>
                        <p className="text-lg font-black text-white leading-none">{stats?.following || 0}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                    {stats?.company && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Building2 className="w-3 h-3" />
                            <span>{stats.company}</span>
                        </div>
                    )}
                    {stats?.location && stats.location !== "Unknown" && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <MapPin className="w-3 h-3" />
                            <span>{stats.location}</span>
                        </div>
                    )}
                    {stats?.blog && (
                        <div className="flex items-center gap-2 text-[11px] text-[#2ea44f]">
                            <LinkIcon className="w-3 h-3" />
                            <a href={stats.blog.startsWith('http') ? stats.blog : `https://${stats.blog}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                                {stats.blog.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
