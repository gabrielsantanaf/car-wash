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

const SERVICES = [
  { id: "Lavagem Simples", label: "Lavagem Simples", desc: "Exterior completo" },
  { id: "Lavagem Completa", label: "Lavagem Completa", desc: "Interno + externo" },
  { id: "Enceramento", label: "Enceramento", desc: "Proteção e brilho" },
  { id: "Polimento", label: "Polimento", desc: "Remove riscos leves" },
  { id: "Higienização Interna", label: "Higienização Interna", desc: "Interior completo" },
];

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
      await axios.post(`${API_URL}/booking/${slug}`, { ...form, scheduled_at });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro ao agendar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <div className="size-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <svg className="size-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-3">Agendamento recebido!</h1>
          <p className="text-muted-foreground text-sm mb-2">
            Enviamos uma mensagem no WhatsApp para <strong className="text-foreground">{form.phone}</strong>.
          </p>
          <p className="text-sm font-semibold text-primary">
            Confirme sua presença pelo link que enviamos para garantir a vaga.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-secondary/50 px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <svg className="size-4 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight leading-none">Agendar Lavagem</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Sem cadastro. Sem senha. Só preencha e confirme.</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 pb-10 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Dados pessoais */}
          <Section title="Seus dados" icon="👤">
            <BookingField label="Nome completo">
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="João Silva" className={inputCls} />
            </BookingField>
            <BookingField label="WhatsApp" hint="Você receberá a confirmação neste número">
              <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" className={inputCls} />
            </BookingField>
          </Section>

          {/* Veículo */}
          <Section title="Veículo" icon="🚗">
            <BookingField label="Placa">
              <input required value={form.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} placeholder="ABC-1234" className={inputCls} />
            </BookingField>
            <div className="grid grid-cols-2 gap-3">
              <BookingField label="Marca">
                <input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Honda" className={inputCls} />
              </BookingField>
              <BookingField label="Modelo">
                <input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Civic" className={inputCls} />
              </BookingField>
            </div>
            <BookingField label="Cor">
              <input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Preto" className={inputCls} />
            </BookingField>
          </Section>

          {/* Serviço */}
          <Section title="Serviço" icon="✨">
            <div className="grid grid-cols-1 gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => set("service_type", s.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    form.service_type === s.id
                      ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${form.service_type === s.id ? "text-primary" : ""}`}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  {form.service_type === s.id && (
                    <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <svg className="size-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Horários */}
          <Section title="Horário" icon="🕐">
            {loadingSlots ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <div className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Carregando horários...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum horário disponível nos próximos dias.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {slots.map((slot) => {
                  const selected = selectedSlot?.slot_id === slot.slot_id && selectedSlot?.date === slot.date;
                  const low = slot.available <= 1;
                  return (
                    <button
                      key={`${slot.slot_id}-${slot.date}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className={`size-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${selected ? "border-primary bg-primary" : "border-border"}`}>
                        {selected && (
                          <svg className="size-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold capitalize">{formatDate(slot.date)}</p>
                        <p className="text-xs text-muted-foreground">{slot.start_time} – {slot.end_time}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        low
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}>
                        {slot.available} {slot.available === 1 ? "vaga" : "vagas"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Section>

          <button
            type="submit"
            disabled={loading || !selectedSlot || !form.service_type}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-4 font-black text-base tracking-wide hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? (
              <>
                <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Agendando...
              </>
            ) : "Confirmar Agendamento"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-secondary border border-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function BookingField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors placeholder:text-muted-foreground/40";
