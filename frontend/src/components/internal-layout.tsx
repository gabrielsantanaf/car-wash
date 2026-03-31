"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export function InternalLayout({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!allowedRoles.includes(payload.role)) { router.push("/login"); return; }
      setRole(payload.role);
    } catch {
      router.push("/login");
    }
  }, []);

  if (!role) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar role={role} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
