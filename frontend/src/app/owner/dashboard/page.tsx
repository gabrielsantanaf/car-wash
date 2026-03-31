"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { CalendarCheck, Users, List, CheckCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:     { label: "Pendente",    cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" },
  scheduled:   { label: "Agendado",   cls: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  in_queue:    { label: "Na fila",    cls: "bg-orange-500/10 text-orange-400 border border-orange-500/20" },
  in_progress: { label: "Em lavagem", cls: "bg-primary/10 text-primary border border-primary/20" },
  done:        { label: "Concluído",  cls: "bg-green-500/10 text-green-400 border border-green-500/20" },
  cancelled:   { label: "Cancelado",  cls: "bg-red-500/10 text-red-400 border border-red-500/20" },
};

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    api.get("/appointments").then((r) => setAppointments(r.data)).catch(() => {});
    api.get("/clients").then((r) => setClients(r.data)).catch(() => {});
    api.get("/queue").then((r) => setQueue(r.data)).catch(() => {});
  }, []);

  const today = appointments.filter((a) => {
    const d = new Date(a.scheduled_at);
    return d.toDateString() === new Date().toDateString();
  });

  const stats = [
    { label: "Agendamentos hoje", value: today.length, icon: <CalendarCheck size={18} />, accent: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Na fila agora",     value: queue.length, icon: <List size={18} />,          accent: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "Total de clientes", value: clients.length, icon: <Users size={18} />,       accent: "text-primary",    bg: "bg-primary/10",    border: "border-primary/20" },
    { label: "Concluídos hoje",   value: today.filter((a) => a.status === "done").length, icon: <CheckCircle size={18} />, accent: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  ];

  return (
    <InternalLayout allowedRoles={["owner"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`bg-background border ${s.border} rounded-2xl p-5 flex flex-col gap-3`}>
              <div className={`size-9 rounded-xl ${s.bg} ${s.accent} flex items-center justify-center`}>{s.icon}</div>
              <div>
                <p className="text-3xl font-black tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-background border border-border rounded-2xl">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Agendamentos de hoje</h2>
          </div>
          {today.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-muted-foreground text-sm">Nenhum agendamento para hoje.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {today.map((a) => {
                const cfg = STATUS_CONFIG[a.status];
                return (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold">{a.service_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {a.client?.name && ` · ${a.client.name}`}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg?.cls ?? "bg-muted text-muted-foreground"}`}>
                      {cfg?.label ?? a.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </InternalLayout>
  );
}
