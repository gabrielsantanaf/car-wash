"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"tenant" | "owner" | "done">("tenant");
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);

  const [tenant, setTenant] = useState({ name: "", slug: "", phone_number: "" });
  const [owner, setOwner] = useState({ name: "", email: "", password: "", confirm: "" });

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant.name || !tenant.slug) { toast.error("Preencha nome e slug"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/tenants`, {
        name: tenant.name,
        slug: tenant.slug.toLowerCase().replace(/\s+/g, "-"),
        phone_number: tenant.phone_number || undefined,
      });
      setTenantId(data.id);
      setStep("owner");
      toast.success("Posto criado!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro ao criar posto");
    } finally {
      setLoading(false);
    }
  }

  async function createOwner(e: React.FormEvent) {
    e.preventDefault();
    if (owner.password !== owner.confirm) { toast.error("Senhas não conferem"); return; }
    if (owner.password.length < 6) { toast.error("Senha mínimo 6 caracteres"); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/setup/owner`, {
        tenant_id: tenantId,
        name: owner.name,
        email: owner.email,
        password: owner.password,
      });
      setStep("done");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <div className="bg-background rounded-xl shadow-md p-8 max-w-md w-full text-center flex flex-col gap-4">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold">Tudo pronto!</h1>
          <p className="text-muted-foreground">
            Seu posto está configurado. Compartilhe o link com seus clientes:
          </p>
          <div className="bg-secondary rounded-lg px-4 py-3 font-mono text-sm font-semibold text-primary">
            {typeof window !== "undefined" ? window.location.origin : ""}/{tenant.slug}
          </div>
          <button
            onClick={() => router.push("/login")}
            className="bg-primary text-primary-foreground rounded-lg py-2.5 font-medium hover:opacity-90"
          >
            Ir para o painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="bg-background rounded-xl shadow-md p-8 max-w-md w-full flex flex-col gap-6">
        {/* Steps */}
        <div className="flex items-center gap-2">
          <Step n={1} label="Seu posto" active={step === "tenant"} done={step === "owner"} />
          <div className="flex-1 h-px bg-border" />
          <Step n={2} label="Sua conta" active={step === "owner"} done={false} />
        </div>

        {step === "tenant" && (
          <form onSubmit={createTenant} className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">Configurar o posto</h2>
              <p className="text-sm text-muted-foreground mt-1">Essas informações ficam visíveis para os clientes.</p>
            </div>
            <Field label="Nome do posto">
              <input
                required value={tenant.name}
                onChange={(e) => setTenant((t) => ({ ...t, name: e.target.value }))}
                placeholder="Lava Rápido do Zé"
                className={inputCls}
              />
            </Field>
            <Field label="Link público (slug)" hint={`Clientes acessarão: ${typeof window !== "undefined" ? window.location.origin : ""}/${tenant.slug || "seu-slug"}`}>
              <input
                required value={tenant.slug}
                onChange={(e) => setTenant((t) => ({ ...t, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                placeholder="lava-ze"
                className={inputCls}
              />
            </Field>
            <Field label="WhatsApp do posto (opcional)">
              <input
                value={tenant.phone_number}
                onChange={(e) => setTenant((t) => ({ ...t, phone_number: e.target.value }))}
                placeholder="(11) 99999-9999"
                className={inputCls}
              />
            </Field>
            <button type="submit" disabled={loading} className={btnCls}>
              {loading ? "Criando..." : "Continuar →"}
            </button>
          </form>
        )}

        {step === "owner" && (
          <form onSubmit={createOwner} className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">Criar sua conta</h2>
              <p className="text-sm text-muted-foreground mt-1">Você será o administrador do posto.</p>
            </div>
            <Field label="Seu nome">
              <input required value={owner.name} onChange={(e) => setOwner((o) => ({ ...o, name: e.target.value }))} placeholder="José Silva" className={inputCls} />
            </Field>
            <Field label="Email">
              <input required type="email" value={owner.email} onChange={(e) => setOwner((o) => ({ ...o, email: e.target.value }))} placeholder="jose@email.com" className={inputCls} />
            </Field>
            <Field label="Senha">
              <input required type="password" value={owner.password} onChange={(e) => setOwner((o) => ({ ...o, password: e.target.value }))} placeholder="Mínimo 6 caracteres" className={inputCls} />
            </Field>
            <Field label="Confirmar senha">
              <input required type="password" value={owner.confirm} onChange={(e) => setOwner((o) => ({ ...o, confirm: e.target.value }))} placeholder="Repita a senha" className={inputCls} />
            </Field>
            <button type="submit" disabled={loading} className={btnCls}>
              {loading ? "Criando conta..." : "Finalizar configuração"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`size-7 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background";
const btnCls = "bg-primary text-primary-foreground rounded-lg py-2.5 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity";
