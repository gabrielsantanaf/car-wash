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
  { href: "/owner/dashboard",        label: "Dashboard",    icon: <LayoutDashboard size={18} />, roles: ["owner"] },
  { href: "/owner/appointments",     label: "Agendamentos", icon: <CalendarCheck size={18} />,   roles: ["owner"] },
  { href: "/attendant/appointments", label: "Agendamentos", icon: <CalendarCheck size={18} />,   roles: ["attendant"] },
  { href: "/owner/clients",          label: "Clientes",     icon: <Users size={18} />,            roles: ["owner"] },
  { href: "/owner/queue",            label: "Fila",         icon: <List size={18} />,             roles: ["owner"] },
  { href: "/attendant/queue",        label: "Fila",         icon: <List size={18} />,             roles: ["attendant"] },
  { href: "/washer/queue",           label: "Fila",         icon: <Droplets size={18} />,         roles: ["washer"] },
  { href: "/owner/capacity",         label: "Capacidade",   icon: <Gauge size={18} />,            roles: ["owner"] },
  { href: "/owner/users",            label: "Funcionários", icon: <UserCog size={18} />,          roles: ["owner"] },
  { href: "/owner/settings",         label: "Configurações",icon: <Settings size={18} />,         roles: ["owner"] },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => n.roles.includes(role));

  function logout() {
    localStorage.clear();
    router.push("/login");
  }

  return (
    <aside className="w-56 shrink-0 bg-background border-r border-border flex flex-col min-h-screen">
      <div className="p-4 border-b border-border">
        <span className="font-bold text-lg">CarWash</span>
        <span className="text-xs text-muted-foreground block capitalize">{role}</span>
      </div>
      <nav className="flex-1 p-2 flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary w-full"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
