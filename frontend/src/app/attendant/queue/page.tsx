"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  waiting: "Aguardando", washing: "Lavando", drying: "Secando", done: "Concluído",
};
const STATUS_CLS: Record<string, string> = {
  waiting: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  washing: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  drying: "bg-primary/10 text-primary border border-primary/20",
  done: "bg-green-500/10 text-green-400 border border-green-500/20",
};
const NEXT_STATUS: Record<string, string> = { waiting: "washing", washing: "drying", drying: "done" };
const NEXT_LABEL: Record<string, string> = { waiting: "Iniciar lavagem", washing: "Iniciar secagem", drying: "Finalizar" };

export default function AttendantQueuePage() {
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
    <InternalLayout allowedRoles={["attendant"]}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">Fila de Lavagem</h1>
          <span className="text-sm text-muted-foreground font-medium">{queue.length} veículo(s)</span>
        </div>
        {queue.length === 0 ? (
          <div className="bg-background border border-border rounded-2xl p-12 text-center text-muted-foreground">Fila vazia no momento.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {queue.map((entry, idx) => (
              <div key={entry.id} className="bg-background border border-border rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-muted-foreground/40 w-8 tabular-nums">{idx + 1}</span>
                  <div>
                    <p className="font-semibold">Posição #{entry.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CLS[entry.status] ?? ""}`}>
                    {STATUS_LABELS[entry.status]}
                  </span>
                  {NEXT_STATUS[entry.status] && (
                    <button onClick={() => advance(entry.id, entry.status)} className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 whitespace-nowrap">
                      {NEXT_LABEL[entry.status]}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </InternalLayout>
  );
}
