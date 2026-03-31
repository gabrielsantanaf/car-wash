"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CalendarCheck, Users, List, Settings, LogOut, Gauge, Droplets, UserCog,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const NAV: NavItem[] = [
  { href: "/owner/dashboard",        label: "Dashboard",    icon: <LayoutDashboard size={16} />, roles: ["owner"] },
  { href: "/owner/appointments",     label: "Agendamentos", icon: <CalendarCheck size={16} />,   roles: ["owner"] },
  { href: "/attendant/appointments", label: "Agendamentos", icon: <CalendarCheck size={16} />,   roles: ["attendant"] },
  { href: "/owner/clients",          label: "Clientes",     icon: <Users size={16} />,            roles: ["owner"] },
  { href: "/owner/queue",            label: "Fila",         icon: <List size={16} />,             roles: ["owner"] },
  { href: "/attendant/queue",        label: "Fila",         icon: <List size={16} />,             roles: ["attendant"] },
  { href: "/washer/queue",           label: "Fila",         icon: <Droplets size={16} />,         roles: ["washer"] },
  { href: "/owner/capacity",         label: "Capacidade",   icon: <Gauge size={16} />,            roles: ["owner"] },
  { href: "/owner/users",            label: "Funcionários", icon: <UserCog size={16} />,          roles: ["owner"] },
  { href: "/owner/settings",         label: "Configurações",icon: <Settings size={16} />,         roles: ["owner"] },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "Administrador",
  attendant: "Atendente",
  washer: "Lavador",
};

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => n.roles.includes(role));

  function logout() {
    localStorage.clear();
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 bg-background border-r border-border flex flex-col min-h-screen">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <svg className="size-3.5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
          </div>
          <div>
            <p className="font-black text-sm tracking-tight leading-none">CarWash</p>
            <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[role] ?? role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
              )}
            >
              <span className={active ? "text-primary" : ""}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full transition-all"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
