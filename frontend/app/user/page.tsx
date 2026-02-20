"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "../lib/socket";
import api from "../lib/api";
import LeetCodeCard from "../components/LeetCodeCard";
import HackerRankCard from "../components/HackerRankCard";
import HackerEarthCard from "../components/HackerEarthCard";
import GitHubCard from "../components/GitHubCard";

export default function UserDashboard() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [leetcodeUsername, setLeetcodeUsername] = useState<string | null>(null);
    const [hackerrankUsername, setHackerrankUsername] = useState<string | null>(null);
    const [hackerearthUsername, setHackerearthUsername] = useState<string | null>(null);
    const [githubUsername, setGithubUsername] = useState<string | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const sendMessage = () => {
        const ws = getSocket();
        if (ws.readyState === WebSocket.OPEN && inputMessage.trim()) {
            ws.send(JSON.stringify({
                type: "USER_TO_ADMIN",
                message: inputMessage
            }));
            setMessages(prev => [...prev, { from: "Me", message: inputMessage }]);
            setInputMessage("");
        }
    };


    //-------------- Leetcode , HackerEarth, HackerRank Configuration--------------- // 
    const fetchProfile = useCallback(async (token: string) => {
        try {
            const res = await api.get("/api/user/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLeetcodeUsername(res.data.leetcode_username ?? null);
            setHackerrankUsername(res.data.hackerrank_username ?? null);
            setHackerearthUsername(res.data.hackerearth_username ?? null);
            setGithubUsername(res.data.github_username ?? null);
        } catch (err: any) {
            console.error("[Profile] Failed to load:", err.response?.data || err.message);
            setLeetcodeUsername(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const storedName = sessionStorage.getItem("name");
        if (!token) {
            router.push("/login");
            return;
        }
        setName(storedName || "User");
        fetchProfile(token);

        const ws = getSocket();

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "PRIVATE_MESSAGE") {
                setMessages(prev => [...prev, { from: data.from, message: data.message }]);
            }
        };

        const registerUser = () => {
            ws.send(JSON.stringify({
                type: "USER_ONLINE",
                userId: sessionStorage.getItem("userId"),
                name: storedName,
                role: "user"
            }));
        };

        if (ws.readyState === WebSocket.OPEN) {
            registerUser();
        } else {
            ws.onopen = registerUser;
        }

    }, [router, fetchProfile]);

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Welcome, {name}</h1>
                <button
                    onClick={() => {
                        sessionStorage.clear();
                        router.push("/login");
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                    Logout
                </button>
            </div>

            {/* Profiles Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {profileLoading ? (
                    <>
                        <div className="rounded-2xl border border-[#FFA116]/10 p-6 animate-pulse bg-[#FFA116]/5 h-48" />
                        <div className="rounded-2xl border border-[#2EC866]/10 p-6 animate-pulse bg-[#2EC866]/5 h-48" />
                        <div className="rounded-2xl border border-[#3273DC]/10 p-6 animate-pulse bg-[#3273DC]/5 h-48" />
                        <div className="rounded-2xl border border-white/5 p-6 animate-pulse bg-white/5 h-48" />
                    </>
                ) : (
                    <>
                        <LeetCodeCard
                            leetcodeUsername={leetcodeUsername}
                            onUsernameSet={setLeetcodeUsername}
                        />
                        <HackerRankCard
                            hackerrankUsername={hackerrankUsername}
                            onUsernameSet={setHackerrankUsername}
                        />
                        <HackerEarthCard
                            hackerearthUsername={hackerearthUsername}
                            onUsernameSet={setHackerearthUsername}
                        />
                        <GitHubCard
                            githubUsername={githubUsername}
                            onUsernameSet={setGithubUsername}
                        />
                    </>
                )}
            </div>

            <div className="card bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h2 className="text-xl mb-4">Your Notifications</h2>
                <div className="max-h-[300px] overflow-y-auto mb-6">
                    {messages.length === 0 ? (
                        <p className="text-slate-500">No new messages.</p>
                    ) : (
                        messages.map((m, i) => (
                            <div key={i} className="bg-slate-800 p-3 rounded mb-2">
                                <span className={m.from === "Me" ? "text-emerald-400 font-bold" : "text-blue-400 font-bold"}>
                                    {m.from}:
                                </span>
                                <span className="ml-2">{m.message}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                        placeholder="Type a message to admin..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
