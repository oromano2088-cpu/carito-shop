"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { CATEGORIAS } from "./seed-data";

// Categorías de la tienda: se guardan en Supabase (tabla "categorias", columna "Nombre")
// para que una categoría nueva quede disponible para siempre.
let cache: string[] | null = null;
const listeners = new Set<(c: string[]) => void>();

async function cargar(): Promise<string[]> {
  if (!supabase) return CATEGORIAS;
  const { data, error } = await supabase.from("categorias").select("Nombre").order("id", { ascending: true });
  if (error || !data) return cache ?? CATEGORIAS;
  const nombres = data.map((r: { Nombre: string }) => (r.Nombre || "").trim()).filter(Boolean);
  return nombres.length ? nombres : CATEGORIAS;
}

export function useCategorias() {
  const [categorias, setCategorias] = useState<string[]>(cache ?? []);
  useEffect(() => {
    let vivo = true;
    const l = (c: string[]) => vivo && setCategorias(c);
    listeners.add(l);
    if (!cache) {
      cargar().then((c) => {
        cache = c;
        listeners.forEach((fn) => fn(c));
      });
    }
    return () => {
      vivo = false;
      listeners.delete(l);
    };
  }, []);

  const agregar = useCallback(async (nombre: string): Promise<{ ok: boolean; nombre: string; error?: string }> => {
    const limpio = nombre.trim().replace(/\s+/g, " ");
    if (!limpio) return { ok: false, nombre: limpio, error: "Escribí un nombre" };
    const actual = cache ?? [];
    const existente = actual.find((c) => c.toLowerCase() === limpio.toLowerCase());
    if (existente) return { ok: true, nombre: existente };
    if (supabase) {
      const { error } = await supabase.from("categorias").insert({ Nombre: limpio });
      if (error) return { ok: false, nombre: limpio, error: "No se pudo guardar. Probá de nuevo." };
    }
    cache = [...actual, limpio];
    listeners.forEach((fn) => fn(cache!));
    return { ok: true, nombre: limpio };
  }, []);

  return { categorias, agregar };
}
