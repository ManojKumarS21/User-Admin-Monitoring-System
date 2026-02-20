"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import Sidebar from "../components/Sidebar";
import LeetCodeCard from "../components/LeetCodeCard";
import ThemeToggle from "../components/ThemeToggle";
import {
  Loader2,
  MessageSquare,
  CheckCircle,
  Users,
  Activity,
  Bell,
  Search,
  Settings,
  ShieldCheck,
  Zap,
  UserCheck,
  UserX,
  Send,
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const PowerBIReport = dynamic(() => import("../components/PowerBIReport"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-20 glass-card h-[500px]">
      <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-4" />
      <p className="text-slate-400 font-medium font-bold uppercase tracking-widest text-[10px]">Syncing Workspace...</p>
    </div>
  )
});

type Message = {
  from: string;
  message: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analyticsFilters, setAnalyticsFilters] = useState<any[]>([]);
  const [currentAnalyticsReportId, setCurrentAnalyticsReportId] = useState<string | undefined>(undefined);
  const [leetcodeUsername, setLeetcodeUsername] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadPending = async () => {
    try {
      const res = await api.get("/admin/pending");
      setPendingUsers(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    socket?.close();
    router.push("/login");
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const ws = getSocket();
    setSocket(ws);

    const registerAdmin = () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "USER_ONLINE",
          userId: "admin",
          name: "Admin",
          role: "admin"
        }));
      }
    };

    if (ws.readyState === WebSocket.OPEN) registerAdmin();
    else ws.onopen = registerAdmin;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ACTIVE_USERS") setOnlineUsers(data.users.filter((u: any) => u.userId !== "admin"));
        if (data.type === "PRIVATE_MESSAGE") setMessages(prev => [...prev, { from: data.from, message: data.message }]);
      } catch (e) { console.error(e); }
    };

    loadPending();

    // Fetch admin's own LeetCode profile
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeetcodeUsername(res.data.leetcode_username ?? null);
      } catch (err: any) {
        console.error("[Profile] Failed to load admin profile:", err.response?.data || err.message);
        setLeetcodeUsername(null);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();

  }, [router, socket]);

  const sendMessage = (u: any) => {
    if (!socket) return;
    const msg = prompt(`Message to ${u.name}`);
    if (!msg) return;
    socket.send(JSON.stringify({ type: "ADMIN_TO_USER", toUserId: u.userId, message: msg }));
    setMessages(prev => [...prev, { from: "Me → " + u.name, message: msg }]);
  };

  const approveUser = async (id: number) => {
    try {
      await api.put(`/admin/approve/${id}`);
      loadPending();
    } catch (err) { console.error(err); }
  };

  const disapproveUser = async (id: number) => {
    try {
      await api.delete(`/admin/reject/${id}`);
      loadPending();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen selection:bg-brand-primary/30" style={{ backgroundColor: "var(--color-background-main)" }}>
      <Sidebar
        onLogout={handleLogout}
        activeUsers={onlineUsers.length}
        onVisibilityChange={setIsSidebarVisible}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <motion.main
        animate={{
          x: isSidebarVisible ? 288 : 0,
          scale: isSidebarVisible ? 0.98 : 1
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="flex flex-col min-h-screen overflow-y-auto custom-scrollbar origin-left"
      >
        <header className="h-20 border-b flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-40" style={{ borderColor: "var(--color-border-subtle)", backgroundColor: "var(--color-background-main)" }}>
          <div className="flex items-center gap-4 border px-4 py-2 rounded-2xl w-96 group focus-within:border-brand-primary/50 transition-all" style={{ backgroundColor: "var(--color-background-card)", borderColor: "var(--color-border-subtle)" }}>
            <Search className="w-4 h-4 group-focus-within:text-brand-primary" style={{ color: "var(--color-text-tertiary)" }} />
            <input type="text" placeholder="Search..." className="bg-transparent border-none p-0 m-0 outline-none text-sm w-full" style={{ color: "var(--color-text-primary)" }} />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: "var(--color-background-card)", borderColor: "var(--color-border-subtle)" }}>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-tertiary)" }}>System Live</span>
            </div>
            <ThemeToggle />
            <button className="relative p-2.5 rounded-xl border transition-all" style={{ backgroundColor: "var(--color-background-card)", borderColor: "var(--color-border-subtle)", color: "var(--color-text-secondary)" }}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-secondary rounded-full" />
            </button>
            <div className="h-8 w-[1px]" style={{ backgroundColor: "var(--color-border-subtle)" }} />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none" style={{ color: "var(--color-text-primary)" }}>Administrator</p>
                <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest mt-1">Super User</p>
              </div>
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-black shadow-glow shadow-brand-primary/20">A</div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black mb-2 tracking-tight uppercase" style={{ color: "var(--color-text-primary)" }}>
                {activeTab === "dashboard" ? "Admin Dashboard" : "Analytics Workspace"}
              </h1>
              <p className="font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                {activeTab === "dashboard" ? "Real-time Monitoring & Overview" : "Power BI Integration"}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "dashboard" ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col gap-8 h-full"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Active Users */}
                  <div className="glass-card p-4 border-l-4 border-emerald-500 flex items-center gap-4 group hover:bg-emerald-500/5 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Active Users</h3>
                      <p className="text-2xl font-black text-white">{onlineUsers.length}</p>
                    </div>
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>

                  {/* Card 2: Pending Approvals */}
                  <div className="glass-card p-4 border-l-4 border-amber-500 flex items-center gap-4 group hover:bg-amber-500/5 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Pending Users</h3>
                      <p className="text-2xl font-black text-white">{pendingUsers.length}</p>
                    </div>
                    <div className="ml-auto">
                      <ShieldCheck className="w-4 h-4 text-amber-500/20" />
                    </div>
                  </div>

                  {/* Card 3: Messages */}
                  <div className="glass-card p-4 border-l-4 border-brand-primary flex items-center gap-4 group hover:bg-brand-primary/5 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-1">Messages</h3>
                      <p className="text-2xl font-black text-white">{messages.length}</p>
                    </div>
                    <div className="ml-auto">
                      <Bell className="w-4 h-4 text-brand-primary/20" />
                    </div>
                  </div>
                </div>

                {/* LeetCode Profile Card */}
                <div className="flex justify-end">
                  <div className="w-full max-w-sm">
                    {profileLoading ? (
                      <div className="rounded-2xl border border-[#FFA116]/10 p-6 animate-pulse bg-[#FFA116]/5 h-48" />
                    ) : (
                      <LeetCodeCard
                        leetcodeUsername={leetcodeUsername}
                        onUsernameSet={setLeetcodeUsername}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[500px]">

                  {/* Pending Users List */}
                  <div className="glass-card p-6 border-t-2 border-white/5 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-white">Pending Approvals</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                      {pendingUsers.length === 0 ? (
                        <div className="text-center p-10 text-slate-500 text-xs font-bold uppercase tracking-widest">
                          No pending users
                        </div>
                      ) : (
                        pendingUsers.map((u: any) => (
                          <div key={u.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-amber-500/30 transition-all">
                            <div>
                              <p className="font-bold text-white text-sm">{u.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{u.email || "No email"}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => approveUser(u.id)}
                                className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-glow"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => disapproveUser(u.id)}
                                className="p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Messages / Live Feed */}
                  <div className="glass-card p-6 border-t-2 border-white/5 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-white">Live Messages</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 bg-black/20 rounded-2xl p-4 border border-white/5">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">No recent messages</p>
                        </div>
                      ) : (
                        messages.map((m, idx) => (
                          <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-black text-brand-primary shrink-0">
                              {m.from.charAt(0)}
                            </div>
                            <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 max-w-[80%]">
                              <p className="text-[10px] text-brand-primary font-bold mb-1">{m.from}</p>
                              <p className="text-xs text-slate-300 leading-relaxed">{m.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Simple Broadcast Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Broadcast to all..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary/50 outline-none transition-all"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim() && socket) {
                              socket.send(JSON.stringify({ type: "ADMIN_TO_USER", targetId: "ALL", message: input.value }));
                              setMessages(prev => [...prev, { from: "Me (Broadcast)", message: input.value }]);
                              input.value = "";
                            }
                          }
                        }}
                      />
                      <button className="p-3 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-all shadow-glow">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : activeTab === "analytics" ? (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Power BI Workspace Only */}
                <div className="glass-card p-6 min-h-[500px] flex flex-col border-t-2 border-white/5">
                  <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Power BI Core</h2>
                        <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mt-0.5">Live Visualization Layer</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className="p-3 bg-white/5 hover:bg-brand-primary/10 rounded-xl transition-all text-slate-400 hover:text-brand-primary border border-white/5"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 bg-black/40 rounded-3xl overflow-hidden border border-white/10 shadow-inner h-[450px]">
                    <PowerBIReport
                      refreshKey={refreshKey}
                      reportId={currentAnalyticsReportId}
                      filters={analyticsFilters}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center p-40 glass-card">
                <div className="text-center space-y-4">
                  <Settings className="w-16 h-16 text-slate-600 mx-auto animate-spin-slow opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Core Configuration - Coming Soon</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.main>
    </div >
  );
}
