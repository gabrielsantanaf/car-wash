"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente", scheduled: "Agendado", in_queue: "Na fila",
  in_progress: "Em lavagem", done: "Concluído", cancelled: "Cancelado",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800", scheduled: "bg-blue-100 text-blue-800",
  in_queue: "bg-orange-100 text-orange-800", in_progress: "bg-purple-100 text-purple-800",
  done: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  async function load() {
    const { data } = await api.get("/appointments");
    setAppointments(data);
  }

  useEffect(() => { load(); }, []);

  async function addToQueue(id: string) {
    try {
      await api.post(`/queue/${id}`);
      toast.success("Adicionado à fila!");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro");
    }
  }

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <InternalLayout allowedRoles={["owner", "attendant"]}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Agendamentos</h1>
          <div className="flex gap-1">
            {["all", "pending", "scheduled", "in_queue", "done", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {s === "all" ? "Todos" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-background rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data/Hora</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Placa</th>
                <th className="text-left px-4 py-3 font-medium">Serviço</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Nenhum agendamento.</td></tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(a.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.client?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{a.client?.phone}</p>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">{a.vehicle?.plate ?? "—"}</td>
                  <td className="px-4 py-3">{a.service_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] ?? ""}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === "scheduled" && (
                      <button onClick={() => addToQueue(a.id)} className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
                        <PlusCircle size={14} /> Adicionar à fila
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InternalLayout>
  );
}
