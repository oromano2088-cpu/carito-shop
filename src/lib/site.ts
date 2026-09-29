// Datos públicos de la tienda, en un solo lugar.
// Se configuran desde Vercel > Settings > Environment Variables:
//   NEXT_PUBLIC_SITE_URL   -> dirección pública de la tienda
//   NEXT_PUBLIC_WHATSAPP   -> número de WhatsApp con código de país, solo dígitos (ej. 5491122334455)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://carito-shop-tienda.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "CARITO.SHOP";
export const SITE_DESCRIPTION =
  "Tienda online de tecnología y accesorios en Argentina. Mirá el catálogo con precios y stock actualizados y consultanos o comprá por WhatsApp.";
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP || "5491100000000").replace(/[^0-9]/g, "");
export const WHATSAPP_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_WHATSAPP);
