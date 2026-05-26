"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";

const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const DURATIONS = [
  { value: 30,  label: "30 min" },
  { value: 45,  label: "45 min" },
  { value: 60,  label: "1 hora" },
  { value: 90,  label: "1h 30min" },
  { value: 120, label: "2 horas" },
];

interface CapacitySlot {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  max_cars: number;
  slot_duration_minutes: number;
}

function slotCount(slot: CapacitySlot): number {
  const [sh, sm] = slot.start_time.split(":").map(Number);
  const [eh, em] = slot.end_time.split(":").map(Number);
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  return totalMinutes > 0 ? Math.floor(totalMinutes / slot.slot_duration_minutes) : 0;
}

export default function CapacityPage() {
  const [slots, setSlots] = useState<CapacitySlot[]>([]);
  const [form, setForm] = useState({
    weekday: "0",
    start_time: "08:00",
    end_time: "18:00",
    max_cars: "2",
    slot_duration_minutes: "60",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const { data } = await api.get("/capacity");
    setSlots(data);
  }

  useEffect(() => { load(); }, []);

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/capacity", {
        weekday: Number(form.weekday),
        start_time: form.start_time,
        end_time: form.end_time,
        max_cars: Number(form.max_cars),
        slot_duration_minutes: Number(form.slot_duration_minutes),
      });
      toast.success("Configuração criada!");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro ao criar");
    }
  }

  async function updateField(id: string, field: string, value: number) {
    try {
      await api.put(`/capacity/${id}`, { [field]: value });
      load();
    } catch {
      toast.error("Erro ao atualizar");
    }
  }

  async function deleteSlot(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/capacity/${id}`);
      toast.success("Configuração removida.");
      load();
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setDeletingId(null);
    }
  }

  const totalSlots = slots.reduce((acc, s) => acc + slotCount(s), 0);

  return (
    <InternalLayout allowedRoles={["owner", "attendant"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Horários de Atendimento</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os dias, horários e duração de cada atendimento. O sistema gera os horários disponíveis automaticamente.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-primary">Como funciona</p>
          <ul className="text-xs text-muted-foreground flex flex-col gap-1">
            <li>• <strong className="text-foreground">Início / Fim</strong> — janela de funcionamento do dia</li>
            <li>• <strong className="text-foreground">Duração</strong> — tempo estimado por carro. Define quantos horários pontuais serão gerados (ex: 08:00, 09:00, 10:00…)</li>
            <li>• <strong className="text-foreground">Vagas simultâneas</strong> — carros que podem ser atendidos ao mesmo tempo. SUVs e caminhonetes ocupam 2 vagas.</li>
          </ul>
        </div>

        {/* Create form */}
        <div className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Nova configuração</h2>
          <form onSubmit={createSlot} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className="text-xs font-semibold text-muted-foreground">Dia da semana</label>
                <select
                  value={form.weekday}
                  onChange={(e) => setForm((f) => ({ ...f, weekday: e.target.value }))}
                  className={inputCls}
                >
                  {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Início</label>
                <input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Fim</label>
                <input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Duração por carro</label>
                <select
                  value={form.slot_duration_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, slot_duration_minutes: e.target.value }))}
                  className={inputCls}
                >
                  {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Vagas simultâneas</label>
                <input
                  type="number" min={1} max={20}
                  value={form.max_cars}
                  onChange={(e) => setForm((f) => ({ ...f, max_cars: e.target.value }))}
                  className={inputCls}
                />
              </div>
              {/* Preview */}
              <div className="flex flex-col justify-end gap-1.5">
                <PreviewBadge
                  start={form.start_time}
                  end={form.end_time}
                  duration={Number(form.slot_duration_minutes)}
                  maxCars={Number(form.max_cars)}
                />
              </div>
            </div>
            <button type="submit" className="bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity">
              Adicionar configuração
            </button>
          </form>
        </div>

        {/* Slots table */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Configurações ativas</h2>
            {totalSlots > 0 && (
              <span className="text-xs text-muted-foreground">{totalSlots} horários gerados por semana</span>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30">
              <tr>
                {["Dia", "Janela", "Duração", "Vagas", "Horários/dia", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {slots.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    Nenhuma configuração criada. Adicione uma acima para liberar os agendamentos.
                  </td>
                </tr>
              )}
              {slots.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">{WEEKDAYS[s.weekday]}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.start_time} – {s.end_time}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={s.slot_duration_minutes}
                      onChange={(e) => updateField(s.id, "slot_duration_minutes", Number(e.target.value))}
                      className="bg-secondary border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min={1} max={20}
                      defaultValue={s.max_cars}
                      onBlur={(e) => updateField(s.id, "max_cars", Number(e.target.value))}
                      className="w-16 bg-secondary border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold bg-secondary border border-border rounded-full px-2.5 py-1">
                      {slotCount(s)} horários
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteSlot(s.id)}
                      disabled={deletingId === s.id}
                      className="text-xs font-semibold text-destructive border border-destructive/30 rounded-md px-3 py-1.5 hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === s.id ? "..." : "Remover"}
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

function PreviewBadge({ start, end, duration, maxCars }: { start: string; end: string; duration: number; maxCars: number }) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm);
  const count = total > 0 && duration > 0 ? Math.floor(total / duration) : 0;

  if (count <= 0) return <div className="h-full" />;

  return (
    <div className="flex flex-col gap-1 bg-secondary rounded-lg px-3 py-2 border border-border">
      <p className="text-xs font-semibold text-muted-foreground">Prévia</p>
      <p className="text-sm font-black">{count} horários</p>
      <p className="text-xs text-muted-foreground">{count * maxCars} vagas totais/dia</p>
    </div>
  );
}

const inputCls = "bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-full";
