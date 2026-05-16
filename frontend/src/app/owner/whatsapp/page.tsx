"use client";

import { useEffect, useState, useCallback } from "react";
import { InternalLayout } from "@/components/internal-layout";
import { api } from "@/lib/api";
import { toast } from "sonner";

type ConnectionState = "open" | "connecting" | "close" | "loading";

const STATUS_LABEL: Record<ConnectionState, string> = {
  open: "Conectado",
  connecting: "Conectando...",
  close: "Desconectado",
  loading: "Verificando...",
};

const STATUS_COLOR: Record<ConnectionState, string> = {
  open: "bg-emerald-500",
  connecting: "bg-amber-500 animate-pulse",
  close: "bg-red-500",
  loading: "bg-muted-foreground animate-pulse",
};

export default function WhatsAppPage() {
  const [state, setState] = useState<ConnectionState>("loading");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/whatsapp/status");
      setState(data.state as ConnectionState);
      if (data.state === "open") setQrBase64(null);
    } catch {
      setState("close");
    }
  }, []);

  // Poll status every 5s
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleConnect() {
    setLoadingQr(true);
    setQrBase64(null);
    try {
      const { data } = await api.get("/whatsapp/qrcode", { timeout: 30000 });
      setQrBase64(data.base64);
      setState("connecting");
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? "";
      if (detail === "already_connected") {
        setState("open");
        toast.success("WhatsApp já está conectado.");
      } else {
        toast.error(detail || "Erro ao gerar QR Code. Tente novamente.");
      }
    } finally {
      setLoadingQr(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await api.delete("/whatsapp/disconnect");
      setQrBase64(null);
      setState("close");
      toast.success("WhatsApp desconectado.");
    } catch {
      toast.error("Erro ao desconectar.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <InternalLayout allowedRoles={["owner"]}>
      <div className="flex flex-col gap-6 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte o número do posto para envio de notificações automáticas.
          </p>
        </div>

        {/* Status card */}
        <div className="bg-background rounded-xl border border-border p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`size-2.5 rounded-full ${STATUS_COLOR[state]}`} />
            <div>
              <p className="text-sm font-semibold">{STATUS_LABEL[state]}</p>
              <p className="text-xs text-muted-foreground">Instância: carwash</p>
            </div>
          </div>
          {state === "open" && (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs font-semibold text-destructive border border-destructive/30 rounded-md px-3 py-1.5 hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              {disconnecting ? "Desconectando..." : "Desconectar"}
            </button>
          )}
        </div>

        {/* QR code area — only when not connected */}
        {state !== "open" && (
          <div className="bg-background rounded-xl border border-border p-6 flex flex-col items-center gap-5">
            {qrBase64 ? (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Abra o WhatsApp no celular &rarr; <strong>Dispositivos conectados</strong> &rarr; <strong>Conectar dispositivo</strong> e escaneie o código abaixo.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrBase64}
                  alt="QR Code WhatsApp"
                  className="size-56 rounded-lg border border-border"
                />
                <p className="text-xs text-muted-foreground">
                  O código expira em ~60 s. Se expirar, clique em &ldquo;Atualizar QR Code&rdquo;.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={loadingQr}
                  className="text-sm font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-50"
                >
                  {loadingQr ? "Carregando..." : "Atualizar QR Code"}
                </button>
              </>
            ) : (
              <>
                <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center">
                  <svg className="size-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Nenhum número conectado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique no botão abaixo para gerar o QR Code e vincular o WhatsApp do posto.
                  </p>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={loadingQr}
                  className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loadingQr ? (
                    <>
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Gerando QR Code...
                    </>
                  ) : "Gerar QR Code"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Connected state */}
        {state === "open" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <svg className="size-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">WhatsApp conectado</p>
              <p className="text-xs text-emerald-600/80 mt-0.5">
                As notificações automáticas estão ativas. Confirmações e lembretes serão enviados normalmente.
              </p>
            </div>
          </div>
        )}
      </div>
    </InternalLayout>
  );
}
