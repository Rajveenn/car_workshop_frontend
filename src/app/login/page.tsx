// File: app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      router.push("/jobs");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.message || "Login failed");
      } else {
        setError("Login failed");
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4 text-black justify-center text-center">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-blue-700 text-white px-4 py-2 rounded w-full hover:bg-blue-800"
        >
          Login
        </button>
      </form>
    </div>
  );
}
