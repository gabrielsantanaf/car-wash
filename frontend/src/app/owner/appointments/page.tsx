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
const STATUS_CLS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  in_queue: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  in_progress: "bg-primary/10 text-primary border border-primary/20",
  done: "bg-green-500/10 text-green-400 border border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [updatingVehicle, setUpdatingVehicle] = useState<string | null>(null);

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

  async function toggleVehicleSize(vehicleId: string, current: string) {
    const next = current === "large" ? "small" : "large";
    setUpdatingVehicle(vehicleId);
    try {
      await api.patch(`/vehicles/${vehicleId}/size`, { size_category: next });
      setAppointments((prev) =>
        prev.map((a) =>
          a.vehicle?.id === vehicleId
            ? { ...a, vehicle: { ...a.vehicle, size_category: next } }
            : a
        )
      );
      toast.success(next === "large" ? "Marcado como SUV/Caminhonete" : "Marcado como carro padrão");
    } catch {
      toast.error("Erro ao atualizar veículo");
    } finally {
      setUpdatingVehicle(null);
    }
  }

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <InternalLayout allowedRoles={["owner", "attendant"]}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-black tracking-tight">Agendamentos</h1>
          <div className="flex gap-1 flex-wrap">
            {["all", "pending", "scheduled", "in_queue", "done", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {s === "all" ? "Todos" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-background border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {["Data/Hora", "Cliente", "Veículo", "Serviço", "Status", "Ações"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">Nenhum agendamento.</td></tr>
              )}
              {filtered.map((a) => {
                const isLarge = a.vehicle?.size_category === "large";
                const updating = updatingVehicle === a.vehicle?.id;
                return (
                  <tr key={a.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {new Date(a.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm">{a.client?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{a.client?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-sm">{a.vehicle?.plate ?? "—"}</p>
                      {a.vehicle?.id && (
                        <button
                          onClick={() => toggleVehicleSize(a.vehicle.id, a.vehicle.size_category ?? "small")}
                          disabled={updating}
                          title={isLarge ? "Clique para marcar como carro padrão" : "Clique para marcar como SUV/caminhonete"}
                          className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors disabled:opacity-50 ${
                            isLarge
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                              : "bg-secondary text-muted-foreground border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          {updating ? "..." : isLarge ? "SUV/Caminhonete" : "Carro"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{a.service_type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CLS[a.status] ?? "bg-muted text-muted-foreground"}`}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "scheduled" && (
                        <button onClick={() => addToQueue(a.id)} className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap font-semibold">
                          <PlusCircle size={14} /> Adicionar à fila
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </InternalLayout>
  );
}
