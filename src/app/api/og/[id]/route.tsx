import { ImageResponse } from "next/og";
import { getPublicProduct } from "@/lib/server-products";
import { finOferta, formatMoney, productImages } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

// Imagen de vista previa (1200x630) para compartir un producto en oferta:
// foto + precio anterior tachado + precio oferta + hora de fin.
export const revalidate = 300;

async function fotoComoDataUrl(src: string | undefined): Promise<string | null> {
  if (!src) return null;
  try {
    const url = src.startsWith("http") ? src : `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`;
    const res = await fetch(url);
    const tipo = res.headers.get("content-type") || "";
    if (!res.ok || !/image\/(jpeg|jpg|png)/.test(tipo)) return null; // otros formatos no se pueden dibujar
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${tipo.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPublicProduct(id);
  if (!p) return new Response("No encontrado", { status: 404 });

  const foto = await fotoComoDataUrl(productImages(p)[0]);
  const fin = p.precioOferta ? finOferta(p.ofertaHasta) : "";
  const enOferta = Boolean(p.precioOferta && fin);
  const precio = formatMoney(p.precioOferta ?? p.precio);
  const titulo = p.titulo.length > 70 ? p.titulo.slice(0, 69) + "…" : p.titulo;

  const imagen = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0b12", color: "#fff", fontFamily: "sans-serif" }}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} width={630} height={630} style={{ width: 630, height: 630, objectFit: "cover" }} alt="" />
        ) : null}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "44px 44px 40px" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#ff3ea5", letterSpacing: 2 }}>CARITO.SHOP</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: foto ? 40 : 56, fontWeight: 700, lineHeight: 1.15 }}>{titulo}</div>
            {enOferta ? (
              <div style={{ display: "flex", fontSize: 34, color: "#9aa0b4", textDecoration: "line-through", marginTop: 22 }}>{formatMoney(p.precio)}</div>
            ) : null}
            <div style={{ display: "flex", fontSize: 76, fontWeight: 800, color: enOferta ? "#ffd400" : "#fff", marginTop: enOferta ? 0 : 22 }}>{precio}</div>
          </div>
          {enOferta ? (
            <div style={{ display: "flex", flexDirection: "column", background: "#ff3ea5", borderRadius: 22, padding: "18px 24px" }}>
              <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 3 }}>OFERTA POR TIEMPO LIMITADO</div>
              <div style={{ display: "flex", fontSize: 36, fontWeight: 800, marginTop: 4 }}>{`Termina ${fin}`}</div>
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 28, color: "#9aa0b4" }}>Pedilo por WhatsApp</div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );

  // WhatsApp ignora vistas previas pesadas: se convierte a JPEG liviano (~100 KB). Si falla, va el PNG.
  const png = Buffer.from(await imagen.arrayBuffer());
  const cache = "public, max-age=300, s-maxage=300";
  try {
    const sharp = (await import("sharp")).default;
    const jpg = await sharp(png).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": cache } });
  } catch {
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": cache } });
  }
}
