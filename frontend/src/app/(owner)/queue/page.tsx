"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  waiting: "Aguardando", washing: "Lavando", drying: "Secando", done: "Concluído",
};
const NEXT_STATUS: Record<string, string> = { waiting: "washing", washing: "drying", drying: "done" };
const NEXT_LABEL: Record<string, string> = { waiting: "Iniciar lavagem", washing: "Iniciar secagem", drying: "Finalizar" };

export default function QueuePage() {
  const [queue, setQueue] = useState<any[]>([]);

  async function load() {
    const { data } = await api.get("/queue");
    setQueue(data);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function advance(entryId: string, currentStatus: string) {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await api.put(`/queue/${entryId}/status`, { status: next });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro");
    }
  }

  return (
    <InternalLayout allowedRoles={["owner", "attendant"]}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Fila de Lavagem</h1>
          <span className="text-sm text-muted-foreground">{queue.length} veículo(s) na fila</span>
        </div>
        {queue.length === 0 ? (
          <div className="bg-background rounded-xl shadow-sm p-8 text-center text-muted-foreground">Fila vazia no momento.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {queue.map((entry, idx) => {
              const v = entry.appointment?.vehicle;
              const c = entry.appointment?.client;
              const service = entry.appointment?.service_type;
              return (
                <div key={entry.id} className="bg-background rounded-xl shadow-sm p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-muted-foreground w-8">{idx + 1}</span>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-bold text-lg tracking-widest">{v?.plate ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">
                        {[v?.brand, v?.model, v?.color].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-sm font-medium">{service}</p>
                      {c && <p className="text-xs text-muted-foreground">{c.name} · {c.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(entry.status)}`}>
                      {STATUS_LABELS[entry.status]}
                    </span>
                    {NEXT_STATUS[entry.status] && (
                      <button
                        onClick={() => advance(entry.id, entry.status)}
                        className="bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded-lg hover:opacity-90 whitespace-nowrap"
                      >
                        {NEXT_LABEL[entry.status]}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </InternalLayout>
  );
}

function statusColor(s: string) {
  return { waiting: "bg-yellow-100 text-yellow-800", washing: "bg-blue-100 text-blue-800", drying: "bg-purple-100 text-purple-800", done: "bg-green-100 text-green-800" }[s] ?? "";
}
