"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [form, setForm] = useState({ confirmation_timeout_hours: 2, cancellation_min_hours: 2, max_noshows: 3 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/tenants/me").then((r) => {
      setTenant(r.data);
      setForm({
        confirmation_timeout_hours: r.data.confirmation_timeout_hours,
        cancellation_min_hours: r.data.cancellation_min_hours,
        max_noshows: r.data.max_noshows,
      });
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/tenants/me", form);
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <InternalLayout allowedRoles={["owner"]}>
      <div className="flex flex-col gap-6 max-w-xl">
        <h1 className="text-2xl font-black tracking-tight">Configurações do Posto</h1>

        {tenant && (
          <div className="bg-background border border-border rounded-2xl p-5">
            <p className="font-black text-lg">{tenant.name}</p>
            <p className="text-sm text-muted-foreground font-mono">/{tenant.slug}</p>
          </div>
        )}

        <form onSubmit={save} className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-5">
          <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Regras de negócio</h2>

          {[
            { label: "Prazo de confirmação (horas)", key: "confirmation_timeout_hours", min: 1, max: 24, hint: "Tempo que o cliente tem para confirmar via WhatsApp." },
            { label: "Antecedência mínima para cancelamento (horas)", key: "cancellation_min_hours", min: 0, max: 48, hint: "Tempo mínimo antes do horário para permitir cancelamento." },
            { label: "Máx. de no-shows para bloquear cliente", key: "max_noshows", min: 1, max: 10, hint: "Quantidade de faltas para bloqueio automático." },
          ].map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</label>
              <p className="text-xs text-muted-foreground/70">{f.hint}</p>
              <input
                type="number" min={f.min} max={f.max}
                value={(form as any)[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
                className="bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-32"
              />
            </div>
          ))}

          <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 font-bold text-sm hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      </div>
    </InternalLayout>
  );
}
