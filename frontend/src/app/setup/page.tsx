"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"tenant" | "owner" | "done">("tenant");
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  const [tenant, setTenant] = useState({ name: "", slug: "", phone_number: "" });
  const [owner, setOwner] = useState({ name: "", email: "", password: "", confirm: "" });

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
      await axios.post(`${API_URL}/tenants/setup/owner`, {
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
    const publicLink = `${origin}/${tenant.slug}`;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Animated checkmark */}
          <div className="flex justify-center mb-8">
            <div className="size-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <svg className="size-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-black text-center tracking-tight mb-2">Tudo pronto!</h1>
          <p className="text-muted-foreground text-center mb-8">
            Seu posto está configurado. Compartilhe o link abaixo com seus clientes para que eles possam agendar online.
          </p>

          <div className="bg-secondary border border-border rounded-xl p-4 mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Link público do posto</p>
            <p className="font-mono text-sm font-bold text-primary break-all">{publicLink}</p>
          </div>

          <button
            onClick={() => router.push("/login")}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
          >
            Acessar o painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-80 xl:w-96 shrink-0 bg-secondary border-r border-border p-10">
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="size-4 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
            </div>
            <span className="font-black text-lg tracking-tight">CarWash</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight leading-tight mb-4">
            Configure seu posto em minutos
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Agendamento online, fila de lavagem, notificações WhatsApp e proteção contra no-show — tudo em um lugar.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {[
            { n: "01", text: "Crie o perfil do posto" },
            { n: "02", text: "Configure sua conta de admin" },
            { n: "03", text: "Compartilhe o link com seus clientes" },
          ].map((item) => (
            <div key={item.n} className="flex items-center gap-3">
              <span className="font-black text-xs text-primary tabular-nums">{item.n}</span>
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <svg className="size-3.5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
            </div>
            <span className="font-black text-base tracking-tight">CarWash</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-10">
            <StepIndicator n={1} label="Posto" active={step === "tenant"} done={step === "owner"} />
            <div className="flex-1 h-px bg-border" />
            <StepIndicator n={2} label="Conta" active={step === "owner"} done={false} />
          </div>

          {step === "tenant" && (
            <form onSubmit={createTenant} className="flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight mb-1">Configurar o posto</h1>
                <p className="text-sm text-muted-foreground">Essas informações ficam visíveis para os clientes.</p>
              </div>

              <FormField label="Nome do posto">
                <input
                  required
                  value={tenant.name}
                  onChange={(e) => setTenant((t) => ({ ...t, name: e.target.value }))}
                  placeholder="Lava Rápido do Zé"
                  className={inputCls}
                />
              </FormField>

              <FormField
                label="Slug (link público)"
                hint={origin ? `${origin}/${tenant.slug || "seu-slug"}` : undefined}
              >
                <input
                  required
                  value={tenant.slug}
                  onChange={(e) => setTenant((t) => ({ ...t, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                  placeholder="lava-ze"
                  className={inputCls}
                />
              </FormField>

              <FormField label="WhatsApp do posto" hint="Opcional — para contato dos clientes">
                <input
                  value={tenant.phone_number}
                  onChange={(e) => setTenant((t) => ({ ...t, phone_number: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className={inputCls}
                />
              </FormField>

              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? "Criando..." : "Continuar"}
                {!loading && (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>
            </form>
          )}

          {step === "owner" && (
            <form onSubmit={createOwner} className="flex flex-col gap-6">
              <div>
                <button
                  type="button"
                  onClick={() => setStep("tenant")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Voltar
                </button>
                <h1 className="text-2xl font-black tracking-tight mb-1">Criar sua conta</h1>
                <p className="text-sm text-muted-foreground">Você será o administrador do posto.</p>
              </div>

              <FormField label="Seu nome">
                <input required value={owner.name} onChange={(e) => setOwner((o) => ({ ...o, name: e.target.value }))} placeholder="José Silva" className={inputCls} />
              </FormField>
              <FormField label="Email">
                <input required type="email" value={owner.email} onChange={(e) => setOwner((o) => ({ ...o, email: e.target.value }))} placeholder="jose@email.com" className={inputCls} />
              </FormField>
              <FormField label="Senha">
                <input required type="password" value={owner.password} onChange={(e) => setOwner((o) => ({ ...o, password: e.target.value }))} placeholder="Mínimo 6 caracteres" className={inputCls} />
              </FormField>
              <FormField label="Confirmar senha">
                <input required type="password" value={owner.confirm} onChange={(e) => setOwner((o) => ({ ...o, confirm: e.target.value }))} placeholder="Repita a senha" className={inputCls} />
              </FormField>

              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? "Criando conta..." : "Finalizar configuração"}
                {!loading && (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`size-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
        active ? "border-primary bg-primary text-primary-foreground" :
        done ? "border-primary bg-primary text-primary-foreground" :
        "border-border text-muted-foreground"
      }`}>
        {done ? (
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : n}
      </div>
      <span className={`text-xs font-semibold tracking-wide uppercase ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground font-mono">{hint}</p>}
    </div>
  );
}

const inputCls = "bg-secondary border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors placeholder:text-muted-foreground/50";
const btnCls = "flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3.5 font-bold text-sm tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity";
