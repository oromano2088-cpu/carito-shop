"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { WHATSAPP_NUMBER } from "./site";

// Número de WhatsApp de la tienda, leído de Supabase (tabla settings, clave "whatsapp").
// Se edita desde /admin/ajustes. Si la base no responde se usa el respaldo de site.ts.
let cache: Promise<string> | null = null;

export function fetchWhatsapp(force = false): Promise<string> {
  if (!cache || force) {
    cache = (async () => {
      if (!supabase) return WHATSAPP_NUMBER;
      const { data, error } = await supabase.from("settings").select("value").eq("key", "whatsapp").maybeSingle();
      const v = (data?.value || "").replace(/[^0-9]/g, "");
      return !error && v ? v : WHATSAPP_NUMBER;
    })().catch(() => WHATSAPP_NUMBER);
  }
  return cache;
}

export function useWhatsapp(): string {
  const [numero, setNumero] = useState(WHATSAPP_NUMBER);
  useEffect(() => {
    let vivo = true;
    fetchWhatsapp().then((n) => vivo && setNumero(n));
    return () => {
      vivo = false;
    };
  }, []);
  return numero;
}
