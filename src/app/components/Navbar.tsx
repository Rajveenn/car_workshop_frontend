// File: components/Navbar.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { TypeAnimation } from "react-type-animation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);

  // const solutionsVariants = {
  //   open: { opacity: 1, height: "auto" },
  //   closed: { opacity: 0, height: 0 },
  // };

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <nav className="bg-slate-800 text-white p-4 shadow-lg hover:shadow-3xl w-full h-full">
      <div className="container lg:px-8 mx-auto my-auto flex justify-between items-center place-items-center">
        <p className=" text-white font-bold">
          {" "}
          <TypeAnimation
            style={{
              whiteSpace: "pre-line",
              display: "block",
            }}
            sequence={[
              "Anbaa",
              1200,
              `Anbaa Automobile`,
              1200,
              `Anbaa Automobile Admin.`,
              1200,
              ``,
              1200,
              "",
            ]}
            repeat={Infinity}
          />
        </p>

        <div className="md:hidden text-center justify-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <motion.div
                key="close-icon"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.3, 0.07, 0.19, 0.97] }}
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="menu-icon"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.3, 0.07, 0.19, 0.97] }}
              >
                <Bars3Icon className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </button>
        </div>

        <div className="space-x-4 hidden md:flex items-center">
          <Link
            className={pathname.startsWith("/jobs") ? "underline" : ""}
            href="/jobs"
          >
            Jobs
          </Link>
          <Link
            className={pathname.startsWith("/earnings") ? "underline" : ""}
            href="/earnings"
          >
            Earnings
          </Link>
          <button
            onClick={handleLogout}
            className="ml-4 text-sm bg-white text-blue-700 px-2 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-slate-800 shadow-2xl w-full mb-4">
          <div className="flex flex-col mt-4">
            <motion.div
              className="items-center justify-center m-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link
                className={pathname.startsWith("/jobs") ? "underline" : ""}
                href="/jobs"
              >
                <button className="flex justify-center items-center text-center px-4 py-2 rounded font-medium text-black bg-slate-200">
                  Invoices
                  {/* <FaCaretRight className="w-5 h-5 transform transition-transform text-blue-800" /> */}
                </button>
              </Link>
            </motion.div>
            <motion.div
              className="items-center justify-center m-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link
                className={pathname.startsWith("/earnings") ? "underline" : ""}
                href="/earnings"
              >
                <button className="flex justify-between items-center text-left px-4 py-2 rounded font-medium text-black bg-slate-200">
                  Earnings
                </button>
              </Link>
            </motion.div>
            <motion.div
              className="items-center justify-center m-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <button
                onClick={handleLogout}
                className="flex justify-between items-center text-left px-4 py-2 rounded font-medium text-black bg-slate-200"
              >
                Logout
              </button>
            </motion.div>
          </div>
        </div>
      )}
    </nav>
  );
}
