"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import FileUpload from "../components/FileUpload";
import Sidebar from "../components/Sidebar";
import {
  Loader2,
  MessageSquare,
  CheckCircle,
  Users,
  Activity,
  FileBarChart,
  Bell,
  Search,
  Settings,
  Mail
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const PowerBIReport = dynamic(() => import("../components/PowerBIReport"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-20 glass-card h-[500px]">
      <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-4" />
      <p className="text-slate-400 font-medium">Initializing Visualization Engine...</p>
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
  const [analyticsResult, setAnalyticsResult] = useState<any>(null);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  const loadPending = async () => {
    try {
      const res = await api.get("/admin/pending");
      setPendingUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load pending users:", err);
    }
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
      console.log("Admin registered");
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "USER_ONLINE",
          userId: "admin",
          name: "Admin",
          role: "admin"
        }));
      }
    };

    if (ws.readyState === WebSocket.OPEN) {
      registerAdmin();
    } else {
      ws.onopen = registerAdmin;
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ACTIVE_USERS") {
          setOnlineUsers(data.users.filter((u: any) => u.userId !== "admin"));
        }
        if (data.type === "PRIVATE_MESSAGE") {
          setMessages(prev => [...prev, { from: data.from, message: data.message }]);
        }
      } catch (e) { console.error(e); }
    };

    loadPending();

    return () => {
      // cleanup
    };
  }, [router]);

  const sendMessage = (u: any) => {
    if (!socket) return;
    const msg = prompt(`Message to ${u.name}`);
    if (!msg) return;

    socket.send(JSON.stringify({
      type: "ADMIN_TO_USER",
      toUserId: u.userId,
      message: msg
    }));

    setMessages(prev => [...prev, { from: "Me → " + u.name, message: msg }]);
  };

  const disapproveUser = async (id: number) => {
    try {
      await api.delete(`/admin/reject/${id}`);
      loadPending();
    } catch (err) {
      console.error("Disapproval failed:", err);
    }
  };

  const approveUser = async (id: number) => {
    try {
      await api.put(`/admin/approve/${id}`);
      loadPending();
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-background-main selection:bg-brand-primary/30">

      {/* SIDEBAR */}
      <Sidebar onLogout={handleLogout} activeUsers={onlineUsers.length} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* TOP NAVBAR */}
        <header className="h-20 border-b border-border-subtle flex items-center justify-between px-8 bg-background-main/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl w-96 group focus-within:border-brand-primary/50 transition-all">
            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-brand-primary" />
            <input
              type="text"
              placeholder="Search analytics, users or logs..."
              className="bg-transparent border-none p-0 m-0 outline-none text-sm w-full placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2.5 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all mt-0 mr-0 mb-0 ml-0 hover:scale-110 active:scale-95">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-secondary rounded-full border-2 border-background-main" />
            </button>
            <div className="h-8 w-[1px] bg-border-subtle" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">Administrator</p>
                <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest mt-1">Super User</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-white font-black shadow-premium">
                A
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT BODY */}
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">

          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">System Overview</h1>
              <p className="text-slate-500 font-medium">Monitor your infrastructure and user activities in real-time.</p>
            </div>
            <div className="flex gap-3">
              <button className="glass border-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">
                Export Logs
              </button>
              <button className="bg-brand-primary shadow-glow shadow-brand-primary/20 px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl text-white hover:scale-105 active:scale-95 transition-all">
                Generate Report
              </button>
            </div>
          </div>

          {/* KPI ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Pending Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6 flex flex-col h-[400px]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                    <Users className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">Pending Access</h3>
                </div>
                <span className="bg-brand-primary/20 text-brand-primary text-[10px] font-black px-2.5 py-1 rounded-lg">
                  {pendingUsers.length} NEW
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-3">
                {pendingUsers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600/40">
                    <CheckCircle className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm italic font-medium">Queue is empty</p>
                  </div>
                ) : (
                  pendingUsers.map((u) => (
                    <div key={u.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-all group">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-white group-hover:text-brand-primary transition-colors">{u.name}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold font-mono">ID: {u.id}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => approveUser(u.id)}
                          className="py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => disapproveUser(u.id)}
                          className="py-2 glass border-white/5 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Live Chat / Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 flex flex-col h-[400px]"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-brand-secondary/10 rounded-xl border border-brand-secondary/20">
                  <MessageSquare className="w-5 h-5 text-brand-secondary" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Live Support</h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-3">
                {onlineUsers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600/40">
                    <div className="w-12 h-12 bg-slate-800/50 rounded-full mb-4 animate-pulse" />
                    <p className="text-sm italic font-medium">No active connections</p>
                  </div>
                ) : (
                  onlineUsers.map((u: any) => (
                    <div key={u.userId} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-brand-primary/30 transition-all cursor-pointer group" onClick={() => sendMessage(u)}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-xs font-black text-white border border-white/5">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-background-main rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-xs font-black text-white group-hover:text-brand-primary transition-colors">{u.name}</p>
                          <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Online</p>
                        </div>
                      </div>
                      <div className="p-2 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary text-brand-primary group-hover:text-white transition-all shadow-inner">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Message Inbox */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 flex flex-col h-[400px]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                    <MessageSquare className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">Message Inbox</h3>
                </div>
                <div className="flex items-center gap-2 bg-brand-primary/10 px-3 py-1 rounded-lg border border-brand-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Live Feed</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600/40">
                    <Mail className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm italic font-medium">No incoming messages</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`p-4 rounded-2xl border transition-all ${m.from.includes("Me")
                      ? "bg-brand-primary/5 border-brand-primary/10 ml-8"
                      : "bg-white/[0.02] border-white/5 mr-8"
                      }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${m.from.includes("Me") ? "text-brand-primary" : "text-brand-secondary"
                          }`}>
                          {m.from}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {m.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

          </div>

          {/* STORAGE INTEGRATION SECTION */}
          <section className="glass-card p-8 relative overflow-hidden group rounded-[3rem]">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileBarChart className="w-64 h-64 text-brand-primary" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-md">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-brand-primary shadow-glow shadow-brand-primary/30 rounded-2xl flex items-center justify-center">
                    <FileBarChart className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Data Pipeline</h2>
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">Instantly transform raw datasets into interactive visual reports. Our engine supports high-speed processing for CSV and Excel formats.</p>
                <div className="flex gap-4 mt-8">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">100ms</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Latency</span>
                  </div>
                  <div className="w-[1px] h-8 bg-border-subtle" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">AES-256</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security</span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:flex-1 max-w-2xl bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-4 shadow-inner">
                <FileUpload onUploadSuccess={(data) => {
                  setAnalyticsResult(data);
                  setShowUploadSuccess(true);
                  setTimeout(() => window.location.reload(), 2000);
                }} />
              </div>
            </div>
          </section>

          {/* VISUALIZATION ENGINE SECTION */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-4">
                <div className="w-3 h-12 bg-brand-primary rounded-full shadow-glow" />
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Analytics Dashboard</h2>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Engine Status: Optimal</span>
              </div>
            </div>

            <div className="glass-card p-2 rounded-[3.5rem] shadow-premium bg-slate-900/10">
              <div className="bg-background-main/80 backdrop-blur-md px-10 py-5 border-b border-border-subtle flex items-center justify-between rounded-t-[3.2rem]">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Business Intelligence Matrix</span>
                </div>
                {analyticsResult && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-brand-primary text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow shadow-brand-primary/30"
                  >
                    🚀 Data Stream Synced
                  </motion.div>
                )}
              </div>

              <div className="rounded-b-[3.2rem] overflow-hidden bg-background-main/50 relative min-h-[600px]">
                <PowerBIReport key={analyticsResult ? 'refreshed-' + Date.now() : 'initial'} />
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Notifications / Feedback Overlays */}
      <AnimatePresence>
        {showUploadSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-main/80 backdrop-blur-xl"
          >
            <div className="glass-card p-12 text-center max-w-md rounded-[3rem] border-brand-primary/30 shadow-glow shadow-brand-primary/10">
              <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-primary/20">
                <CheckCircle className="w-12 h-12 text-brand-primary" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Upload Successful!</h2>
              <p className="text-slate-400 font-medium mb-8">Synchronizing your dataset with the visualization engine. The dashboard will refresh automatically.</p>
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rebuilding Workspace...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
