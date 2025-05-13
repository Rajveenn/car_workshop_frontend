// File: app/layout.tsx
import "./globals.css";
import Navbar from "./components/Navbar";
import Loader from "./components/Loader";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Anbaa Automobile Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <Loader />
        <main className="p-4 max-w-6xl mx-auto">
          {children}
          <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 2500,
            style: { cursor: "pointer" },
            success: { duration: 2500 },
            error: { duration: 2500 }
          }}
        />
        </main>
      </body>
    </html>
  );
}
