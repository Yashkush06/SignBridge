"use client";

import { useEffect } from "react";
import { initAuthListener } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAuthListener();
  }, []);

  return <>{children}</>;
}
