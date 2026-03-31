"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

interface Slot {
  slot_id: string;
  date: string;
  weekday: number;
  start_time: string;
  end_time: string;
  available: number;
  max_cars: number;
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const SERVICES = ["Lavagem Simples", "Lavagem Completa", "Enceramento", "Polimento", "Higienização Interna"];

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [form, setForm] = useState({
    name: "", phone: "", plate: "", brand: "", model: "", color: "", service_type: "",
  });

  useEffect(() => {
    axios.get(`${API_URL}/booking/${slug}/slots`)
      .then((r) => setSlots(r.data.filter((s: Slot) => s.available > 0)))
      .catch(() => toast.error("Erro ao carregar horários"))
      .finally(() => setLoadingSlots(false));
  }, [slug]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.service_type) { toast.error("Selecione um serviço"); return; }
    if (!selectedSlot) { toast.error("Selecione um horário"); return; }

    const scheduled_at = `${selectedSlot.date}T${selectedSlot.start_time}:00Z`;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/booking/${slug}`, {
        ...form,
        scheduled_at,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro ao agendar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <div className="bg-background rounded-xl shadow-md p-8 max-w-md w-full text-center flex flex-col gap-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold">Agendamento recebido!</h1>
          <p className="text-muted-foreground">
            Enviamos uma mensagem no WhatsApp para <strong>{form.phone}</strong>.
          </p>
          <p className="text-sm font-medium">Confirme sua presença pelo link que enviamos para garantir a vaga.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary p-4">
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <div className="bg-background rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold">Agendar Lavagem</h1>
          <p className="text-muted-foreground text-sm mt-1">Sem cadastro. Sem senha. Só preencha e confirme.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Dados pessoais */}
          <div className="bg-background rounded-xl shadow-sm p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Seus dados</h2>
            <Field label="Nome completo">
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="João Silva" className={inputCls} />
            </Field>
            <Field label="WhatsApp" hint="Você receberá a confirmação neste número">
              <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" className={inputCls} />
            </Field>
          </div>

          {/* Veículo */}
          <div className="bg-background rounded-xl shadow-sm p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Veículo</h2>
            <Field label="Placa">
              <input required value={form.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} placeholder="ABC-1234" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Marca">
                <input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Honda" className={inputCls} />
              </Field>
              <Field label="Modelo">
                <input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Civic" className={inputCls} />
              </Field>
            </div>
            <Field label="Cor">
              <input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Preto" className={inputCls} />
            </Field>
          </div>

          {/* Serviço */}
          <div className="bg-background rounded-xl shadow-sm p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Serviço</h2>
            <div className="grid grid-cols-1 gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => set("service_type", s)}
                  className={`text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${form.service_type === s ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Horários */}
          <div className="bg-background rounded-xl shadow-sm p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Horário disponível</h2>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Carregando horários...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum horário disponível nos próximos dias.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {slots.map((slot) => (
                  <button
                    key={`${slot.slot_id}-${slot.date}`}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 text-sm transition-colors ${selectedSlot?.slot_id === slot.slot_id && selectedSlot?.date === slot.date ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <span className="font-medium capitalize">{formatDate(slot.date)}</span>
                    <span className="text-muted-foreground">{slot.start_time} – {slot.end_time}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${slot.available <= 1 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {slot.available} vaga{slot.available !== 1 ? "s" : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !selectedSlot || !form.service_type}
            className="bg-primary text-primary-foreground rounded-xl py-4 font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity text-base"
          >
            {loading ? "Agendando..." : "Confirmar Agendamento"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
