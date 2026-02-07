"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

export default function LoginPage() {

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {

    const res = await api.post("/login", {
      email,
      password
    });

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
  };


  return (
    <div className="min-h-screen flex items-center justify-center">

      <div className="card w-[420px]">

        <h1 className="text-center mb-6">😊 Login</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full mt-4"
          onClick={login}
        >
          Login
        </button>

        <p className="text-center mt-4">
          Don’t have account? <a href="/register">Register</a>
        </p>

      </div>

    </div>
  );
}
