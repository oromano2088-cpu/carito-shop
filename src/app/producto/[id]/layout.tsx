import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getPublicProduct } from "@/lib/server-products";
import { productImages } from "@/lib/utils";

export const revalidate = 600;

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

function resumen(texto: string | undefined, max = 155) {
  const t = (texto || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

// Título, descripción y vista previa propios de cada producto (Google, WhatsApp, Instagram).
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await getPublicProduct(id);
  if (!p) return { title: `Producto no encontrado | ${SITE_NAME}`, robots: { index: false } };
  const precio = (p.precioOferta ?? p.precio).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const title = `${p.titulo} — ${precio} | ${SITE_NAME}`;
  const description = resumen(`${p.titulo}. ${p.descripcion || ""} Consultá stock y comprá por WhatsApp en ${SITE_NAME}.`);
  const url = `${SITE_URL}/producto/${p.id}`;
  const imagenes = productImages(p);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: SITE_NAME, locale: "es_AR", images: imagenes.slice(0, 4).map((u) => ({ url: u, alt: p.titulo })) },
    twitter: { card: "summary_large_image", title, description, images: imagenes.slice(0, 1) },
  };
}

// Datos estructurados schema.org/Product: nombre, fotos, precio y stock reales del catálogo.
export default async function ProductoLayout({ params, children }: Props) {
  const { id } = await params;
  const p = await getPublicProduct(id);
  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.titulo,
        description: p.descripcion || undefined,
        sku: p.sku || undefined,
        category: p.categoria || undefined,
        image: productImages(p),
        url: `${SITE_URL}/producto/${p.id}`,
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/producto/${p.id}`,
          priceCurrency: "ARS",
          price: p.precioOferta ?? p.precio,
          ...(p.precioOferta && p.ofertaHasta ? { priceValidUntil: p.ofertaHasta.slice(0, 10) } : {}),
          availability: p.stock > 0 && p.status !== "agotado" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: SITE_NAME },
        },
      }
    : null;
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      {children}
    </>
  );
}
