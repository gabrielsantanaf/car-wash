"use client";

import { useEffect, useState, useRef } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { GripVertical, Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  is_active: boolean;
  sort_order: number;
}

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return null;
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await api.get("/services");
    setServices(data);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const price = newPrice ? parseFloat(newPrice.replace(",", ".")) : null;
      await api.post("/services", {
        name: newName.trim(),
        description: newDesc.trim() || null,
        price,
      });
      setNewName("");
      setNewDesc("");
      setNewPrice("");
      toast.success("Serviço adicionado!");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Erro ao adicionar");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(s: Service) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditDesc(s.description ?? "");
    setEditPrice(s.price !== null && s.price !== undefined ? String(s.price) : "");
  }

  async function saveEdit(id: string) {
    try {
      const price = editPrice ? parseFloat(editPrice.replace(",", ".")) : null;
      await api.put(`/services/${id}`, {
        name: editName.trim(),
        description: editDesc.trim() || null,
        price,
      });
      setEditingId(null);
      load();
    } catch {
      toast.error("Erro ao salvar");
    }
  }

  async function toggleActive(s: Service) {
    try {
      await api.put(`/services/${s.id}`, { is_active: !s.is_active });
      load();
    } catch {
      toast.error("Erro ao atualizar");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/services/${id}`);
      toast.success("Serviço removido.");
      load();
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setDeletingId(null);
    }
  }

  const active = services.filter((s) => s.is_active);
  const inactive = services.filter((s) => !s.is_active);

  return (
    <InternalLayout allowedRoles={["owner"]}>
      <div className="flex flex-col gap-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Serviços</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os serviços oferecidos. Apenas serviços ativos aparecem para o cliente no agendamento.
          </p>
        </div>

        {/* Add form */}
        <div className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Novo serviço</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nome</label>
              <input
                ref={nameRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Lavagem Premium"
                className={inputCls}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Descrição <span className="font-normal">(opcional)</span></label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Ex: Lavagem completa com cera"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Preço <span className="font-normal">(opcional)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                <input
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value.replace(/[^\d,.]/, ""))}
                  placeholder="0,00"
                  className={`${inputCls} pl-9`}
                  inputMode="decimal"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus size={15} />
              {adding ? "Adicionando..." : "Adicionar serviço"}
            </button>
          </form>
        </div>

        {/* Active services */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
            Ativos ({active.length})
          </p>
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6 bg-background border border-border rounded-2xl">
              Nenhum serviço ativo.
            </p>
          )}
          {active.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              isEditing={editingId === s.id}
              editName={editName}
              editDesc={editDesc}
              editPrice={editPrice}
              onEditName={setEditName}
              onEditDesc={setEditDesc}
              onEditPrice={setEditPrice}
              onStartEdit={() => startEdit(s)}
              onSaveEdit={() => saveEdit(s.id)}
              onCancelEdit={() => setEditingId(null)}
              onToggle={() => toggleActive(s)}
              onDelete={() => handleDelete(s.id)}
              deleting={deletingId === s.id}
            />
          ))}
        </div>

        {/* Inactive services */}
        {inactive.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
              Inativos ({inactive.length})
            </p>
            {inactive.map((s) => (
              <ServiceRow
                key={s.id}
                service={s}
                isEditing={editingId === s.id}
                editName={editName}
                editDesc={editDesc}
                editPrice={editPrice}
                onEditName={setEditName}
                onEditDesc={setEditDesc}
                onEditPrice={setEditPrice}
                onStartEdit={() => startEdit(s)}
                onSaveEdit={() => saveEdit(s.id)}
                onCancelEdit={() => setEditingId(null)}
                onToggle={() => toggleActive(s)}
                onDelete={() => handleDelete(s.id)}
                deleting={deletingId === s.id}
              />
            ))}
          </div>
        )}
      </div>
    </InternalLayout>
  );
}

function ServiceRow({
  service, isEditing, editName, editDesc, editPrice,
  onEditName, onEditDesc, onEditPrice, onStartEdit, onSaveEdit, onCancelEdit,
  onToggle, onDelete, deleting,
}: {
  service: Service;
  isEditing: boolean;
  editName: string;
  editDesc: string;
  editPrice: string;
  onEditName: (v: string) => void;
  onEditDesc: (v: string) => void;
  onEditPrice: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className={`bg-background border border-border rounded-xl p-4 flex items-start gap-3 transition-opacity ${!service.is_active ? "opacity-50" : ""}`}>
      <GripVertical size={16} className="text-muted-foreground/40 mt-0.5 shrink-0" />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input
              value={editName}
              onChange={(e) => onEditName(e.target.value)}
              placeholder="Nome do serviço"
              className={inputCls}
              autoFocus
            />
            <input
              value={editDesc}
              onChange={(e) => onEditDesc(e.target.value)}
              placeholder="Descrição (opcional)"
              className={inputCls}
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <input
                value={editPrice}
                onChange={(e) => onEditPrice(e.target.value.replace(/[^\d,.]/, ""))}
                placeholder="0,00"
                className={`${inputCls} pl-9`}
                inputMode="decimal"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{service.name}</p>
              {service.price !== null && service.price !== undefined && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {formatPrice(service.price)}
                </span>
              )}
            </div>
            {service.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isEditing ? (
          <>
            <button onClick={onSaveEdit} className="p-1.5 rounded-lg text-green-600 hover:bg-green-500/10 transition-colors">
              <Check size={15} />
            </button>
            <button onClick={onCancelEdit} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
              <X size={15} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onToggle}
              title={service.is_active ? "Desativar" : "Ativar"}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                service.is_active
                  ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                  : "bg-secondary text-muted-foreground border-border hover:border-muted-foreground/40"
              }`}
            >
              {service.is_active ? "Ativo" : "Inativo"}
            </button>
            <button onClick={onStartEdit} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors placeholder:text-muted-foreground/40";
