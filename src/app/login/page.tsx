// File: app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import axios from "axios";
import Loader from "../components/Loader";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      toast.success("Login successful");
      router.push("/jobs");
    } catch (err) {

      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800">
      {loading ? (
        <Loader />
      ) : (
        <div className="backdrop-blur-md bg-white/30 border border-white/25 rounded-xl p-8 max-w-md w-full mx-4 shadow-md hover:shadow-2xl hover:shadow-slate-600">
          <h1 className="text-3xl font-extrabold mb-6 text-gray-200 text-center uppercase">Admin Login system</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                className="w-full border-none bg-white/50 p-3 rounded-md placeholder-gray-700 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                className="w-full border-none bg-white/50 p-3 rounded-md placeholder-gray-700 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-500 text-white hover:text-black font-semibold py-3 rounded-md transition-opacity disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
