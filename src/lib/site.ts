// Datos públicos de la tienda, en un solo lugar.
// Se configuran desde Vercel > Settings > Environment Variables:
//   NEXT_PUBLIC_SITE_URL   -> dirección pública de la tienda
//   El número de WhatsApp se cambia desde el panel admin > Ajustes (se guarda en Supabase).
//   NEXT_PUBLIC_WHATSAPP queda solo como respaldo si la base no responde.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://carito-shop-tienda.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "CARITO.SHOP";
// Ficha de la tienda en Google Maps (reseñas, ubicación).
export const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/SySkiuEDdS5sLaor5";
// Código de verificación de Google Search Console (etiqueta HTML "google-site-verification").
export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION || "";
export const SITE_DESCRIPTION =
  "Tienda online de tecnología y accesorios en Argentina. Mirá el catálogo con precios y stock actualizados y consultanos o comprá por WhatsApp.";
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP || "5491133851488").replace(/[^0-9]/g, "");

// Convierte lo que se escriba (ej. "11 4176-8461", "011 15 4176 8461", "+54 9 11...")
// al formato que usa WhatsApp: 549 + característica + número, solo dígitos.
export function normalizeWhatsapp(input: string): string {
  let d = input.replace(/[^0-9]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  if (d.startsWith("0")) d = d.slice(1);
  // Saca el "15" de celulares escritos como 11 15 xxxx-xxxx
  if (d.length === 12 && d.startsWith("15", 2)) d = d.slice(0, 2) + d.slice(4);
  else if (d.length === 12 && d.startsWith("15", 3)) d = d.slice(0, 3) + d.slice(5);
  else if (d.length === 12 && d.startsWith("15", 4)) d = d.slice(0, 4) + d.slice(6);
  return d.length === 10 ? "549" + d : "";
}
