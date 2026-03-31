"use client";

// Attendant view — same as owner appointments, just re-exports with attendant role check
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

export default function AttendantAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);

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

  return (
    <InternalLayout allowedRoles={["attendant"]}>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <div className="bg-background rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data/Hora</th>
                <th className="text-left px-4 py-3 font-medium">Serviço</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Nenhum agendamento.</td></tr>
              )}
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    {new Date(a.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">{a.service_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] ?? ""}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === "scheduled" && (
                      <button onClick={() => addToQueue(a.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">
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
