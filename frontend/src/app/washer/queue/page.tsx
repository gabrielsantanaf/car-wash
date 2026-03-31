"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Droplets, Wind, CheckCircle, RefreshCw } from "lucide-react";

const NEXT_STATUS: Record<string, string> = { waiting: "washing", washing: "drying", drying: "done" };

const ACTIONS: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  waiting: { label: "INICIAR LAVAGEM", icon: <Droplets size={28} />, cls: "bg-blue-600 hover:bg-blue-500" },
  washing: { label: "INICIAR SECAGEM", icon: <Wind size={28} />,     cls: "bg-primary hover:opacity-90" },
  drying:  { label: "FINALIZAR",       icon: <CheckCircle size={28} />, cls: "bg-green-600 hover:bg-green-500" },
};

export default function WasherQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await api.get("/queue");
    setQueue(data);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  async function advance(entryId: string, currentStatus: string) {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    setLoading(true);
    try {
      await api.put(`/queue/${entryId}/status`, { status: next });
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro");
    } finally {
      setLoading(false);
    }
  }

  const current = queue.find((e) => e.status !== "done");
  const v = current?.appointment?.vehicle;
  const service = current?.appointment?.service_type;

  return (
    <InternalLayout allowedRoles={["washer"]}>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-6 p-4">
        {!current ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="size-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-black">Fila vazia</h1>
            <p className="text-muted-foreground">Nenhum veículo aguardando.</p>
            <button onClick={load} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col gap-4">
            <p className="text-center text-xs text-muted-foreground font-black uppercase tracking-widest">Próximo veículo</p>

            <div className="bg-background border border-border rounded-2xl p-8 flex flex-col gap-4 text-center">
              <p className="text-5xl font-black tracking-widest">{v?.plate ?? "—"}</p>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold text-muted-foreground">
                  {[v?.brand, v?.model].filter(Boolean).join(" ") || "Veículo"}
                </p>
                {v?.color && <p className="text-sm text-muted-foreground">{v.color}</p>}
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-base font-bold">{service}</p>
              </div>
              {current.started_at && (
                <p className="text-xs text-muted-foreground">
                  Iniciado às {new Date(current.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>

            {ACTIONS[current.status] && (
              <button
                onClick={() => advance(current.id, current.status)}
                disabled={loading}
                className={`${ACTIONS[current.status].cls} text-white rounded-2xl py-6 flex flex-col items-center gap-3 font-black text-lg transition-all disabled:opacity-50`}
              >
                {ACTIONS[current.status].icon}
                {loading ? "Atualizando..." : ACTIONS[current.status].label}
              </button>
            )}

            {queue.length > 1 && (
              <p className="text-center text-sm text-muted-foreground">
                +{queue.length - 1} veículo(s) aguardando na fila
              </p>
            )}
          </div>
        )}
      </div>
    </InternalLayout>
  );
}
