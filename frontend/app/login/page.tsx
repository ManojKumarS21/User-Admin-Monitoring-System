"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

export default function LoginPage() {

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = async () => {
    try {
      console.log("🔵 Attempting login...", { email, url: api.defaults.baseURL });

      const res = await api.post("/login", {
        email,
        password
      });

      console.log("✅ Login Response:", res.data);

      if (res.data.token) {
        // SAVE EVERYTHING
        sessionStorage.setItem("token", res.data.token);
        sessionStorage.setItem("userId", res.data.userId);
        sessionStorage.setItem("name", res.data.name);
        sessionStorage.setItem("role", res.data.role);

        if (res.data.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/user");
        }
      } else {
        alert(res.data);
      }
    } catch (err: any) {
      console.error("❌ Login Error:", err);
      const msg = err.response?.data || err.message || "Login failed";
      alert(`Login Error: ${msg}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      login();
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center">

      <div className="card w-[420px]">

        <h1 className="text-center mb-6">😊 Login</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          suppressHydrationWarning
        />

        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            suppressHydrationWarning
            style={{ paddingRight: "45px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              padding: "0",
              width: "auto",
              minWidth: "auto"
            }}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>

        <button
          className="w-full mt-4"
          onClick={login}
        >
          Login
        </button>

        <p className="text-center mt-4">
          Don't have account? <a href="/register">Register</a>
        </p>

      </div>

    </div>
  );
}
