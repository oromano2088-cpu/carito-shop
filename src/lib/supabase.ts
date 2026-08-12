import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Si todavía no configuraste Supabase, la app sigue funcionando con datos de ejemplo
// en memoria (ver store-context.tsx) para que puedas seguir probando sin romper nada.
export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
