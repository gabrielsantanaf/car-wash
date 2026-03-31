"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ShieldOff } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);

  async function load() {
    const { data } = await api.get("/clients");
    setClients(data);
  }

  useEffect(() => { load(); }, []);

  async function unblock(id: string) {
    try {
      await api.put(`/clients/${id}/unblock`);
      toast.success("Cliente desbloqueado");
      load();
    } catch {
      toast.error("Erro ao desbloquear");
    }
  }

  return (
    <InternalLayout allowedRoles={["owner"]}>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-black tracking-tight">Clientes</h1>
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {["Nome", "Telefone", "No-shows", "Status", "Ações"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">Nenhum cliente cadastrado.</td></tr>
              )}
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 tabular-nums">{c.noshow_count}</td>
                  <td className="px-4 py-3">
                    {c.is_blocked ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Bloqueado</span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Ativo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.is_blocked && (
                      <button onClick={() => unblock(c.id)} className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
                        <ShieldOff size={14} /> Desbloquear
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
