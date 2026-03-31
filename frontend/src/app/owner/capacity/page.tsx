"use client";

import { useEffect, useState } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";

const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function CapacityPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [form, setForm] = useState({ weekday: "0", start_time: "08:00", end_time: "12:00", max_cars: "2" });

  async function load() {
    const { data } = await api.get("/capacity");
    setSlots(data);
  }

  useEffect(() => { load(); }, []);

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/capacity", { ...form, weekday: Number(form.weekday), max_cars: Number(form.max_cars) });
      toast.success("Faixa criada!");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro");
    }
  }

  async function updateMaxCars(id: string, value: number) {
    try {
      await api.put(`/capacity/${id}`, { max_cars: value });
      load();
    } catch {
      toast.error("Erro ao atualizar");
    }
  }

  return (
    <InternalLayout allowedRoles={["owner", "attendant"]}>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-black tracking-tight">Gestão de Capacidade</h1>

        <div className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Nova faixa de horário</h2>
          <form onSubmit={createSlot} className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Dia da semana</label>
              <select value={form.weekday} onChange={(e) => setForm((f) => ({ ...f, weekday: e.target.value }))} className={inputCls}>
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
              <label className="text-xs font-semibold text-muted-foreground">Máx. carros</label>
              <input type="number" min={1} value={form.max_cars} onChange={(e) => setForm((f) => ({ ...f, max_cars: e.target.value }))} className={inputCls} />
            </div>
            <button type="submit" className="col-span-2 md:col-span-4 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90">
              Adicionar faixa
            </button>
          </form>
        </div>

        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {["Dia", "Início", "Fim", "Máx. carros"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {slots.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground text-sm">Nenhuma faixa configurada.</td></tr>
              )}
              {slots.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">{WEEKDAYS[s.weekday]}</td>
                  <td className="px-4 py-3">{s.start_time}</td>
                  <td className="px-4 py-3">{s.end_time}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min={1}
                      defaultValue={s.max_cars}
                      onBlur={(e) => updateMaxCars(s.id, Number(e.target.value))}
                      className="w-16 bg-secondary border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
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

const inputCls = "bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-full";
