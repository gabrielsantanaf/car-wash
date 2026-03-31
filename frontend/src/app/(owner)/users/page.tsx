"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

const ROLE_LABELS: Record<string, string> = { owner: "Dono", attendant: "Atendente", washer: "Lavador" };
const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800",
  attendant: "bg-blue-100 text-blue-800",
  washer: "bg-green-100 text-green-800",
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
      toast.success("Usuário criado!");
      setForm({ name: "", email: "", password: "", role: "attendant" });
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Remover ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Usuário removido");
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  }

  return (
    <InternalLayout allowedRoles={["owner"]}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Funcionários</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <UserPlus size={16} />
            Novo funcionário
          </button>
        </div>

        {showForm && (
          <form onSubmit={createUser} className="bg-background rounded-xl shadow-sm p-5 flex flex-col gap-4">
            <h2 className="font-semibold">Novo funcionário</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nome">
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="João Silva" className={inputCls} />
              </Field>
              <Field label="Email">
                <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="joao@email.com" className={inputCls} />
              </Field>
              <Field label="Senha">
                <input required type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" className={inputCls} />
              </Field>
              <Field label="Função">
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={inputCls}>
                  <option value="attendant">Atendente</option>
                  <option value="washer">Lavador</option>
                  <option value="owner">Dono</option>
                </select>
              </Field>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {loading ? "Criando..." : "Criar funcionário"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="bg-background rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Função</th>
                <th className="text-left px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Nenhum funcionário cadastrado.</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background";
