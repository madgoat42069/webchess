import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "LichessClone - Play Chess Online",
  description: "Free online chess platform for playing and learning chess",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#1a1a1a]">
        <Navbar />
        <main className="pt-4">
          {children}
        </main>
      </body>
    </html>
  );
}
