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
        <h1 className="text-2xl font-black tracking-tight">Agendamentos</h1>
        <div className="bg-background border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {["Data/Hora", "Serviço", "Status", "Ações"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground text-sm">Nenhum agendamento.</td></tr>
              )}
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    {new Date(a.scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 font-semibold">{a.service_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CLS[a.status] ?? "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === "scheduled" && (
                      <button onClick={() => addToQueue(a.id)} className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
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
