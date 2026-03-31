"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

const ROLE_LABELS: Record<string, string> = { owner: "Dono", attendant: "Atendente", washer: "Lavador" };
const ROLE_CLS: Record<string, string> = {
  owner: "bg-primary/10 text-primary border border-primary/20",
  attendant: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  washer: "bg-green-500/10 text-green-400 border border-green-500/20",
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "attendant" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await api.get("/users");
    setUsers(data);
  }

  useEffect(() => { load(); }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Senha mínimo 6 caracteres"); return; }
    setLoading(true);
    try {
      await api.post("/users", form);
      toast.success("Funcionário criado!");
      setForm({ name: "", email: "", password: "", role: "attendant" });
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro ao criar funcionário");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Remover ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Funcionário removido");
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  }

  return (
    <InternalLayout allowedRoles={["owner"]}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">Funcionários</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"
          >
            <UserPlus size={16} />
            Novo funcionário
          </button>
        </div>

        {showForm && (
          <form onSubmit={createUser} className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Novo funcionário</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Nome", key: "name", type: "text", placeholder: "João Silva" },
                { label: "Email", key: "email", type: "email", placeholder: "joao@email.com" },
                { label: "Senha", key: "password", type: "password", placeholder: "Mínimo 6 caracteres" },
              ].map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">{f.label}</label>
                  <input
                    required type={f.type} placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Função</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={inputCls}>
                  <option value="attendant">Atendente</option>
                  <option value="washer">Lavador</option>
                  <option value="owner">Dono</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
                {loading ? "Criando..." : "Criar funcionário"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary font-medium">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {["Nome", "Email", "Função", ""].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground text-sm">Nenhum funcionário cadastrado.</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_CLS[u.role] ?? "bg-muted text-muted-foreground"}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteUser(u.id, u.name)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={16} />
                    </button>
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

const inputCls = "bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary";
