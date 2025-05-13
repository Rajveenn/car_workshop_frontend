// File: app/layout.tsx
"use client"
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import Nav from "./components/Navbar"; // or wherever your navbar lives

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Paths where you DON'T want to show the nav
  const hideNavOn = ["/login", "/register"];

  const showNav = !hideNavOn.includes(pathname);

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        {showNav && <Nav />}
        <main className="flex-grow">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
