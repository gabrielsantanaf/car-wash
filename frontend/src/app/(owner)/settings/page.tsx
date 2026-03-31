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
        <h1 className="text-2xl font-bold">Configurações do Posto</h1>
        {tenant && (
          <div className="bg-background rounded-xl shadow-sm p-5 flex flex-col gap-1">
            <p className="font-semibold text-lg">{tenant.name}</p>
            <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
          </div>
        )}
        <form onSubmit={save} className="bg-background rounded-xl shadow-sm p-5 flex flex-col gap-5">
          <Field label="Prazo de confirmação (horas)" hint="Tempo que o cliente tem para confirmar o agendamento pelo WhatsApp.">
            <input
              type="number" min={1} max={24}
              value={form.confirmation_timeout_hours}
              onChange={(e) => setForm((f) => ({ ...f, confirmation_timeout_hours: Number(e.target.value) }))}
              className={inputCls}
            />
          </Field>
          <Field label="Antecedência mínima para cancelamento (horas)" hint="Tempo mínimo antes do horário para permitir cancelamento.">
            <input
              type="number" min={0} max={48}
              value={form.cancellation_min_hours}
              onChange={(e) => setForm((f) => ({ ...f, cancellation_min_hours: Number(e.target.value) }))}
              className={inputCls}
            />
          </Field>
          <Field label="Máximo de no-shows antes de bloquear" hint="Quantidade de faltas sem aviso para bloquear automaticamente o cliente.">
            <input
              type="number" min={1} max={10}
              value={form.max_noshows}
              onChange={(e) => setForm((f) => ({ ...f, max_noshows: Number(e.target.value) }))}
              className={inputCls}
            />
          </Field>
          <button type="submit" disabled={saving} className="bg-primary text-primary-foreground rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      </div>
    </InternalLayout>
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
