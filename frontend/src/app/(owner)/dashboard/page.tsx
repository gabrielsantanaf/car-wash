"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { CalendarCheck, Users, List, CheckCircle } from "lucide-react";

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
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const stats = [
    { label: "Hoje", value: today.length, icon: <CalendarCheck size={20} />, color: "text-blue-600" },
    { label: "Na fila", value: queue.length, icon: <List size={20} />, color: "text-orange-500" },
    { label: "Clientes", value: clients.length, icon: <Users size={20} />, color: "text-green-600" },
    {
      label: "Concluídos hoje",
      value: today.filter((a) => a.status === "done").length,
      icon: <CheckCircle size={20} />,
      color: "text-emerald-600",
    },
  ];

  return (
    <InternalLayout allowedRoles={["owner"]}>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-background rounded-xl p-5 shadow-sm flex flex-col gap-2">
              <div className={cn("flex items-center gap-2", s.color)}>
                {s.icon}
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              <span className="text-3xl font-bold">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-background rounded-xl shadow-sm p-5">
          <h2 className="font-semibold mb-4">Agendamentos de hoje</h2>
          {today.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum agendamento para hoje.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {today.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.service_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </InternalLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    scheduled: "bg-blue-100 text-blue-800",
    in_queue: "bg-orange-100 text-orange-800",
    in_progress: "bg-purple-100 text-purple-800",
    done: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    pending: "Pendente", scheduled: "Agendado", in_queue: "Na fila",
    in_progress: "Em lavagem", done: "Concluído", cancelled: "Cancelado",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function cn(...c: string[]) { return c.filter(Boolean).join(" "); }
