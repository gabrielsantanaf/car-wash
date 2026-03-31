"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Se já tiver token válido, vai pro painel
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expired = payload.exp * 1000 < Date.now();
        if (!expired) {
          if (payload.role === "washer") { router.replace("/washer/queue"); return; }
          if (payload.role === "attendant") { router.replace("/attendant/appointments"); return; }
          router.replace("/owner/dashboard");
          return;
        }
      } catch {}
    }

    // Verifica se algum tenant já foi criado
    axios.get(`${API_URL}/tenants/exists`)
      .then(({ data }) => {
        if (data.exists) {
          router.replace("/login");
        } else {
          router.replace("/setup");
        }
      })
      .catch(() => router.replace("/setup"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
