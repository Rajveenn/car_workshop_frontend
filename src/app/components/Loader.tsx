// File: components/Loader.tsx
"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Loader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-white/60 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
    </div>
  );
}
