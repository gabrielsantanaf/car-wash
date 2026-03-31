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
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="bg-background rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Telefone</th>
                <th className="text-left px-4 py-3 font-medium">No-shows</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhum cliente cadastrado.</td></tr>
              )}
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3">{c.noshow_count}</td>
                  <td className="px-4 py-3">
                    {c.is_blocked ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Bloqueado</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Ativo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.is_blocked && (
                      <button
                        onClick={() => unblock(c.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
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
