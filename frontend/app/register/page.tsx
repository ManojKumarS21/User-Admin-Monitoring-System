"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    const res = await api.post("/register", {
      name,
      email,
      password
    });

    alert(res.data);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">

      <div className="card w-[400px]">

        <h1 className="text-center mb-2"> 😉Register </h1>
        <p className="text-center text-gray-400 mb-8">
          Create your account
        </p>

        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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

        <button className="w-full mt-2" onClick={register}>
          Register
        </button>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <a href="/login">Login</a>
        </p>

      </div>

    </div>
  );
}
