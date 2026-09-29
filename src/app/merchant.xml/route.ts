import { getPublicProducts } from "@/lib/server-products";
import { SITE_URL, SITE_NAME } from "@/lib/site";

// Feed de productos para Google Merchant Center (listados gratuitos en Google Shopping).
// URL: /merchant.xml  — se registra una sola vez en merchants.google.com.
export const revalidate = 3600;

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const products = await getPublicProducts();
  const items = products
    .filter((p) => {
      const img = (p.imagenes && p.imagenes[0]) || p.imagen || "";
      return /^https?:/.test(img) && p.precio > 0;
    })
    .map((p) => {
      const img = (p.imagenes && p.imagenes[0]) || p.imagen;
      const precio = p.precioOferta ?? p.precio;
      const disponible = p.status !== "agotado" && p.stock > 0;
      const extra = (p.imagenes || []).slice(1, 10).map((u) => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`).join("");
      return `<item>
<g:id>${esc(p.id)}</g:id>
<title>${esc(p.titulo)}</title>
<description>${esc(p.descripcion || p.titulo)}</description>
<link>${SITE_URL}/producto/${encodeURIComponent(p.id)}</link>
<g:image_link>${esc(img)}</g:image_link>${extra}
<g:price>${precio.toFixed(2)} ARS</g:price>
<g:availability>${disponible ? "in_stock" : "out_of_stock"}</g:availability>
<g:condition>new</g:condition>
<g:identifier_exists>no</g:identifier_exists>
<g:brand>${esc(SITE_NAME)}</g:brand>
</item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(SITE_NAME)}</title>
<link>${SITE_URL}</link>
<description>Catálogo de ${esc(SITE_NAME)}</description>
${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
