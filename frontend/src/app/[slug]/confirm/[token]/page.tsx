"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

export default function ConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "success" | "expired" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/booking/confirm/${token}`)
      .then((r) => {
        setMessage(r.data.message);
        setState("success");
      })
      .catch((err) => {
        const status = err?.response?.status;
        setMessage(err?.response?.data?.detail ?? "Erro ao confirmar agendamento.");
        setState(status === 410 ? "expired" : "error");
      });
  }, [token]);

  const icons = { loading: "⏳", success: "✅", expired: "⏰", error: "❌" };
  const titles = {
    loading: "Confirmando...",
    success: "Agendamento confirmado!",
    expired: "Link expirado",
    error: "Erro",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="bg-background rounded-xl shadow-md p-8 max-w-md w-full text-center flex flex-col gap-4">
        <div className="text-5xl">{icons[state]}</div>
        <h1 className="text-2xl font-bold">{titles[state]}</h1>
        {message && <p className="text-muted-foreground">{message}</p>}
        {state === "success" && (
          <p className="text-sm text-muted-foreground">
            Você receberá um lembrete antes do horário agendado.
          </p>
        )}
        {state === "expired" && (
          <p className="text-sm text-muted-foreground">
            Seu agendamento foi cancelado. Acesse o link do posto para reagendar.
          </p>
        )}
      </div>
    </div>
  );
}
