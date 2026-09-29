import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Permite que buscadores y asistentes de IA lean el catálogo público.
// Las secciones privadas (panel, carrito, checkout, guardados) quedan fuera.
export default function robots(): MetadataRoute.Robots {
  const privadas = ["/admin", "/checkout", "/carrito", "/guardados"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privadas },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Bingbot"],
        allow: "/",
        disallow: privadas,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
