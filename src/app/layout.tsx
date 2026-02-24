import type { Metadata } from "next";
import "./globals.css";
import { LabelProvider } from "@/context/LabelContext";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Big Push Matcher",
  description: "Recruitment matching systeem voor Big Push",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="font-sans antialiased">
        <LabelProvider>
          <div className="flex h-screen flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </LabelProvider>
      </body>
    </html>
  );
}
