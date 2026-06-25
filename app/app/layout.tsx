"use client";

import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { Suspense, useEffect } from "react";

function SidebarFallback() {
  return <div className="hidden lg:block w-72 flex-shrink-0" />;
}

function BottomNavFallback() {
  return <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-black border-t dark:border-zinc-800" />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    sessionStorage.removeItem("left_app");
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200 overflow-x-hidden relative">
      {/* Background Gradient Blobs - Precisely positioned centers, stronger in light mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top-Right Blob: Center at Navbar bottom / Screen right edge */}
        <div className="absolute top-16 right-0 w-[1000px] h-[1000px] rounded-full bg-lime-400/40 dark:bg-lime-500/10 blur-[140px] -translate-y-1/2 translate-x-1/2" />
        
        {/* Bottom-Left Blob: Center at Sidebar inner edge / Screen bottom edge */}
        <div className="absolute bottom-0 left-72 w-[1000px] h-[1000px] rounded-full bg-foodappka-400/40 dark:bg-foodappka-400/10 blur-[140px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen bg-transparent">
        <AppHeader />
        
        <div className="flex flex-1 pt-16 pb-20 lg:pb-0 bg-transparent">
          <Suspense fallback={<SidebarFallback />}>
            <Sidebar />
          </Suspense>
          
          {/* Spacer for fixed sidebar on desktop */}
          <div className="hidden lg:block w-72 flex-shrink-0" />
          
          <main className="flex-1 p-4 md:p-6 lg:p-10 text-zinc-900 dark:text-zinc-100 min-w-0 bg-transparent">
            <div className="max-w-4xl mx-auto">
              <Suspense fallback={
                <div className="flex items-center justify-center py-20 text-zinc-400">
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Načítání...
                </div>
              }>
                {children}
              </Suspense>
            </div>
          </main>
        </div>

        <Suspense fallback={<BottomNavFallback />}>
          <BottomNav />
        </Suspense>
      </div>
    </div>
  );
}
