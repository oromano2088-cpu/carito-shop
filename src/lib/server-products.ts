import { createClient } from "@supabase/supabase-js";
import { rowToProduct } from "./db-mappers";
import type { Product } from "./types";

// Lectura de productos del lado del servidor (para buscadores, sitemap y vistas previas al compartir).
function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getPublicProducts(): Promise<Product[]> {
  const sb = client();
  if (!sb) return [];
  const { data, error } = await sb.from("products").select("*").neq("status", "pausado");
  if (error || !data) return [];
  return data.map(rowToProduct);
}

export async function getPublicProduct(id: string): Promise<Product | null> {
  const sb = client();
  if (!sb) return null;
  const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToProduct(data);
}
