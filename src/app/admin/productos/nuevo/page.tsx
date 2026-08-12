"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store-context";
import { CATEGORIAS } from "@/lib/seed-data";
import { Button, Badge } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";

// Sugerencias que simulan lo que devolvería un modelo de IA (GPT-4o Vision / Claude)
// al analizar la foto de un producto de electrónica. En producción esto sería una
// llamada real a una API de visión + generación de texto.
const AI_TEMPLATES = [
  {
    titulo: "Auriculares Bluetooth Inalámbricos",
    categoria: "Audio",
    descripcion: "Auriculares inalámbricos con cancelación de ruido activa, hasta 24hs de batería y conexión estable Bluetooth 5.3. Ideales para el día a día y viajes.",
    caracteristicas: ["Bluetooth 5.3", "Cancelación de ruido activa", "24hs de batería", "Resistentes al sudor IPX4"],
    precioSugerido: 89000,
  },
  {
    titulo: "Cargador Rápido USB-C 65W",
    categoria: "Accesorios",
    descripcion: "Cargador de carga rápida compatible con notebooks, celulares y tablets. Tecnología GaN, más pequeño y eficiente que un cargador tradicional.",
    caracteristicas: ["65W de potencia", "Tecnología GaN", "Compatible multi-dispositivo", "Protección contra sobrecarga"],
    precioSugerido: 35000,
  },
  {
    titulo: "Mouse Gamer Inalámbrico RGB",
    categoria: "Gaming",
    descripcion: "Mouse gamer de alta precisión con sensor óptico de 16000 DPI, iluminación RGB personalizable y batería de larga duración.",
    caracteristicas: ["16000 DPI ajustable", "Iluminación RGB", "Inalámbrico 2.4GHz", "6 botones programables"],
    precioSugerido: 62000,
  },
  {
    titulo: "Hub USB-C 7 en 1",
    categoria: "Accesorios",
    descripcion: "Adaptador multipuerto con salida HDMI 4K, lector de tarjetas SD y 3 puertos USB 3.0. Compatible con notebooks Windows y Mac.",
    caracteristicas: ["HDMI 4K@30Hz", "3x USB 3.0", "Lector SD/microSD", "Carga passthrough 100W"],
    precioSugerido: 48000,
  },
];

export default function NuevoProducto() {
  const { addProduct } = useApp();
  const router = useRouter();
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [analizando, setAnalizando] = useState(false);
  const [autocompletado, setAutocompletado] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [descripcion, setDescripcion] = useState("");
  const [caracteristicas, setCaracteristicas] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("10");
  const [garantia, setGarantia] = useState("12");
  const [guardando, setGuardando] = useState(false);

  const onImagesChange = (imgs: string[]) => {
    const isFirstImage = imagenes.length === 0 && imgs.length > 0;
    setImagenes(imgs);
    if (isFirstImage && !autocompletado) {
      setAnalizando(true);
      setTimeout(() => {
        const t = AI_TEMPLATES[Math.floor(Math.random() * AI_TEMPLATES.length)];
        setTitulo((v) => v || t.titulo);
        setCategoria((v) => (v === CATEGORIAS[0] ? t.categoria : v));
        setDescripcion((v) => v || t.descripcion);
        setCaracteristicas((v) => v || t.caracteristicas.join(", "));
        setPrecio((v) => v || String(t.precioSugerido));
        setAnalizando(false);
        setAutocompletado(true);
      }, 1400);
    }
  };

  const submit = () => {
    if (!titulo || !precio || imagenes.length === 0) return;
    setGuardando(true);
    addProduct({
      titulo,
      categoria,
      descripcion,
      caracteristicas: caracteristicas.split(",").map((c) => c.trim()).filter(Boolean),
      precio: Number(precio),
      imagen: imagenes[0],
      imagenes,
      stock: Number(stock),
      stockMinimo: Math.max(2, Math.round(Number(stock) * 0.2)),
      garantiaMeses: Number(garantia),
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      status: "activo",
    });
    router.push("/admin/productos");
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <h1 className="text-lg font-extrabold">Cargar producto con foto 📸</h1>

      <div className="relative">
        <ImageUploader images={imagenes} onChange={onImagesChange} />
        {analizando && (
          <div className="absolute inset-0 bg-black/70 rounded-xl flex flex-col items-center justify-center gap-2 text-white pointer-events-none">
            <span className="text-2xl animate-pulse">🤖✨</span>
            <span className="text-sm font-semibold">Analizando imagen con IA...</span>
          </div>
        )}
      </div>

      {autocompletado && (
        <div className="flex items-center gap-2 bg-accent-2/10 border border-accent-2/30 rounded-xl px-3 py-2">
          <span>✨</span>
          <p className="text-xs text-accent-2 font-semibold">La IA completó los campos por vos. Revisá y editá lo que quieras.</p>
        </div>
      )}

      <Field label="Título">
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input" placeholder="Ej: Auriculares Bluetooth" />
      </Field>

      <Field label="Categoría">
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input">
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Descripción">
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="input min-h-24" placeholder="Descripción del producto" />
      </Field>

      <Field label="Características (separadas por coma)">
        <input value={caracteristicas} onChange={(e) => setCaracteristicas(e.target.value)} className="input" placeholder="Bluetooth 5.3, 24hs batería..." />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Precio $">
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} type="number" className="input" />
        </Field>
        <Field label="Stock">
          <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" className="input" />
        </Field>
        <Field label="Garantía (meses)">
          <input value={garantia} onChange={(e) => setGarantia(e.target.value)} type="number" className="input" />
        </Field>
      </div>

      <Button className="w-full" onClick={submit} disabled={!titulo || !precio || imagenes.length === 0 || guardando}>
        {guardando ? "Publicando..." : "Publicar producto"}
      </Button>
      {imagenes.length === 0 && (
        <p className="text-[11px] text-muted text-center -mt-2">Agregá al menos una foto para poder publicar.</p>
      )}
      <p className="text-[11px] text-muted text-center -mt-2">
        <Badge>Demo</Badge> En producción, la foto se envía a un modelo de visión (GPT-4o / Claude) que genera título, descripción, categoría y precio sugerido reales.
      </p>

      <style jsx global>{`
        .input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}
