"use client";

import type { ReactNode } from "react";
import { PlatformAuthProvider } from "@/lib/PlatformAuthProvider";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <PlatformAuthProvider>{children}</PlatformAuthProvider>;
}
