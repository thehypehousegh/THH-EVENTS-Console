"use client";

import { Suspense, type ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";
import { AppDataProvider } from "@/lib/AppDataProvider";
import { TopBar } from "@/components/TopBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AppDataProvider>
        <Suspense fallback={null}>
          <TopBar />
        </Suspense>
        {children}
      </AppDataProvider>
    </AuthGate>
  );
}
