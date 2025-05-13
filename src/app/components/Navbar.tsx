// File: components/Navbar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <nav className="bg-blue-700 text-white p-4 mb-4">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <div className="font-bold text-lg">Anbaa Automobile</div>
        <div className="space-x-4">
          <Link className={pathname.startsWith("/jobs") ? "underline" : ""} href="/jobs">Jobs</Link>
          <Link className={pathname.startsWith("/earnings") ? "underline" : ""} href="/earnings">Earnings</Link>
          <button onClick={handleLogout} className="ml-4 text-sm bg-white text-blue-700 px-2 py-1 rounded">Logout</button>
        </div>
      </div>
    </nav>
  );
}
