// File: app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn } from "lucide-react";

// A simple spinner component for the login button
const Spinner = () => (
  <motion.div
    className="w-5 h-5 border-2 border-t-transparent rounded-full"
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  />
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // State to trigger shake animation on error
  const [animateState, setAnimateState] = useState("initial");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // ✅ FIX: Add validation to prevent submitting empty fields
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password cannot be empty.");
      setAnimateState("shake"); // Trigger shake for visual feedback
      return; // Stop the submission
    }

    setLoading(true);
    setAnimateState("initial"); // Reset animation state

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      toast.success("Login Successful");
      router.push("/jobs");
    } catch (err) {
      // Trigger shake animation
      setAnimateState("shake");
      const errorMessage =
        axios.isAxiosError(err) && err.response
          ? err.response.data?.message
          : "Login failed. Please check your credentials.";
      
      // Use toast for error popup
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }
  
  // Variants for staggering animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const formVariants = {
    initial: { x: 0 },
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0">
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900"
                animate={{
                    backgroundPositionX: ["0%", "100%", "0%"]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    backgroundSize: "400% 400%"
                }}
            />
        </div>

      <motion.div
        variants={formVariants}
        initial="initial"
        animate={animateState}
        className="relative z-10 backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-slate-900/50"
      >
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.h1
              variants={itemVariants}
              className="text-3xl font-bold mb-6 text-gray-100 text-center uppercase tracking-wider"
            >
              Admin Login
            </motion.h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={itemVariants} className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  className="w-full border-none bg-black/20 p-3 pl-10 rounded-md placeholder-gray-400 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </motion.div>
              
              <motion.div variants={itemVariants} className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  className="w-full border-none bg-black/20 p-3 pl-10 rounded-md placeholder-gray-400 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-500 hover:bg-slate-950 text-white font-semibold py-3 rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : <LogIn size={20}/>}
                  <span>{loading ? "Logging in..." : "Login"}</span>
                </button>
              </motion.div>
            </form>
        </motion.div>
      </motion.div>
    </div>
  );
}