"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store-context";
import { CATEGORIAS } from "@/lib/seed-data";
import { Button, Badge } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { Product, ProductStatus, ProductVariant } from "@/lib/types";
import { uid } from "@/lib/utils";

function toDatetimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { products } = useApp();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-muted">Producto no encontrado.</p>
      </div>
    );
  }

  return <ProductForm key={product.id} product={product} />;
}

function ProductForm({ product }: { product: Product }) {
  const { updateProduct, deleteProduct } = useApp();
  const router = useRouter();

  const [imagenes, setImagenes] = useState<string[]>(product.imagenes && product.imagenes.length ? product.imagenes : [product.imagen]);
  const [titulo, setTitulo] = useState(product.titulo);
  const [categoria, setCategoria] = useState(product.categoria);
  const [descripcion, setDescripcion] = useState(product.descripcion);
  const [caracteristicas, setCaracteristicas] = useState(product.caracteristicas.join(", "));
  const [precio, setPrecio] = useState(String(product.precio));
  const [precioOferta, setPrecioOferta] = useState(product.precioOferta ? String(product.precioOferta) : "");
  const [ofertaHasta, setOfertaHasta] = useState(toDatetimeLocal(product.ofertaHasta));
  const [stock, setStock] = useState(String(product.stock));
  const [stockMinimo, setStockMinimo] = useState(String(product.stockMinimo));
  const [garantia, setGarantia] = useState(String(product.garantiaMeses));
  const [sku, setSku] = useState(product.sku);
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [variantes, setVariantes] = useState<ProductVariant[]>(product.variantes ?? []);
  const [guardado, setGuardado] = useState(false);

  const addVariante = () => setVariantes((v) => [...v, { id: uid("v"), nombre: "", stock: 0 }]);
  const updateVariante = (idx: number, patch: Partial<ProductVariant>) =>
    setVariantes((v) => v.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const removeVariante = (idx: number) => setVariantes((v) => v.filter((_, i) => i !== idx));

  const guardar = () => {
    if (!titulo || !precio || imagenes.length === 0) return;
    updateProduct(product.id, {
      titulo,
      categoria,
      descripcion,
      caracteristicas: caracteristicas.split(",").map((c) => c.trim()).filter(Boolean),
      precio: Number(precio),
      precioOferta: precioOferta ? Number(precioOferta) : undefined,
      ofertaHasta: ofertaHasta ? new Date(ofertaHasta).toISOString() : undefined,
      imagen: imagenes[0],
      imagenes,
      stock: Number(stock),
      stockMinimo: Number(stockMinimo),
      garantiaMeses: Number(garantia),
      sku,
      status,
      variantes: variantes.filter((v) => v.nombre.trim()).length ? variantes.filter((v) => v.nombre.trim()) : undefined,
    });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const eliminar = () => {
    if (!confirm(`¿Eliminar "${product.titulo}"? Esta acción no se puede deshacer.`)) return;
    deleteProduct(product.id);
    router.push("/admin/productos");
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-4 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Editar producto</h1>
        <Badge>{product.sku}</Badge>
      </div>

      <ImageUploader images={imagenes} onChange={setImagenes} />

      <Field label="Título">
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría">
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input">
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Estado">
          <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)} className="input">
            <option value="activo">Activo</option>
            <option value="pausado">Pausado</option>
            <option value="agotado">Agotado</option>
          </select>
        </Field>
      </div>

      <Field label="Descripción">
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="input min-h-24" />
      </Field>

      <Field label="Características (separadas por coma)">
        <input value={caracteristicas} onChange={(e) => setCaracteristicas(e.target.value)} className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio $">
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} type="number" className="input" />
        </Field>
        <Field label="Precio oferta $ (opcional)">
          <input value={precioOferta} onChange={(e) => setPrecioOferta(e.target.value)} type="number" className="input" placeholder="Sin oferta" />
        </Field>
      </div>

      {precioOferta && (
        <Field label="Oferta válida hasta">
          <input value={ofertaHasta} onChange={(e) => setOfertaHasta(e.target.value)} type="datetime-local" className="input" />
        </Field>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Field label="Stock">
          <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" className="input" />
        </Field>
        <Field label="Stock mínimo">
          <input value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} type="number" className="input" />
        </Field>
        <Field label="Garantía (meses)">
          <input value={garantia} onChange={(e) => setGarantia(e.target.value)} type="number" className="input" />
        </Field>
      </div>

      <Field label="SKU">
        <input value={sku} onChange={(e) => setSku(e.target.value)} className="input" />
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">Variantes (opcional, ej: color, capacidad)</span>
          <button onClick={addVariante} className="text-xs font-bold text-accent">+ Agregar variante</button>
        </div>
        {variantes.map((v, idx) => (
          <div key={v.id} className="flex gap-2 items-center bg-surface border border-border rounded-xl p-2.5">
            <input
              value={v.nombre}
              onChange={(e) => updateVariante(idx, { nombre: e.target.value })}
              placeholder="Ej: 128GB - Negro"
              className="input !py-2 flex-1"
            />
            <input
              value={v.stock}
              onChange={(e) => updateVariante(idx, { stock: Number(e.target.value) })}
              type="number"
              placeholder="Stock"
              className="input !py-2 w-16"
            />
            <input
              value={v.precioExtra ?? ""}
              onChange={(e) => updateVariante(idx, { precioExtra: e.target.value ? Number(e.target.value) : undefined })}
              type="number"
              placeholder="+$"
              className="input !py-2 w-16"
            />
            <button onClick={() => removeVariante(idx)} className="h-9 w-9 shrink-0 rounded-lg bg-surface-2 border border-border text-danger">✕</button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <Button className="w-full" onClick={guardar} disabled={!titulo || !precio || imagenes.length === 0}>
          {guardado ? "Guardado ✓" : "Guardar cambios"}
        </Button>
        <button onClick={eliminar} className="text-sm font-semibold text-danger text-center py-2">
          Eliminar producto
        </button>
      </div>

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
