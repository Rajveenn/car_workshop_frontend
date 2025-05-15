"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { TypeAnimation } from "react-type-animation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const linkClass = (path: string) =>
    pathname.startsWith(path)
      ? "underline underline-offset-4 text-blue-300"
      : "hover:text-blue-200";

  return (
    <nav className="bg-slate-800 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-4">
        <div className="text-lg font-bold">
          <TypeAnimation
            sequence={[
              "Anbaa",
              1200,
              "Anbaa Automobile",
              1200,
              "Admin Panel",
              1200,
              "",
              1000,
            ]}
            wrapper="span"
            repeat={Infinity}
            className="inline-block"
          />
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        <div className="hidden md:flex gap-6 items-center">
          <Link href="/jobs" className={linkClass("/jobs")}>
            Jobs
          </Link>
          <Link href="/earnings" className={linkClass("/earnings")}>
            Earnings
          </Link>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded shadow hover:shadow-lg transition"
          >
            <LogOut size={16} /> Logout
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-slate-900 mt-4 rounded-lg shadow-lg p-4 space-y-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/jobs" onClick={() => setIsMenuOpen(false)}>
                <span
                  className={`block px-4 py-2 rounded ${linkClass("/jobs")}`}
                >
                  Jobs
                </span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/earnings" onClick={() => setIsMenuOpen(false)}>
                <span
                  className={`block px-4 py-2 rounded ${linkClass(
                    "/earnings"
                  )}`}
                >
                  Earnings
                </span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-blue-700 rounded hover:shadow-md"
              >
                <LogOut size={16} /> Logout
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
