"use client";

import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface dark:bg-black transition-colors duration-200">
      <AppHeader />
      
      <div className="flex pt-20 pb-20 lg:pb-0">
        <Sidebar />
        
        {/* Spacer for fixed sidebar on desktop */}
        <div className="hidden lg:block w-72 flex-shrink-0" />
        
        <main className="flex-1 p-4 md:p-6 lg:p-10 text-zinc-900 dark:text-zinc-100 min-w-0">
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

      <BottomNav />
    </div>
  );
}
