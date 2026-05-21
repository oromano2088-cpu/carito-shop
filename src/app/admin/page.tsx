"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

type Producto = { id: number; nombre: string; descripcion: string; precio: number; emoji: string; activo: boolean; imagen: string; imagen2: string; imagen3: string; categoria: string; stock: number; };
type Categoria = { id: number; Nombre: string; };
const CLAVE = "carito2026";

export default function Admin() {
  const [logueado, setLogueado] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [listadoCategorias, setListadoCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", precio: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: "", stock: "0" });
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [toast, setToast] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);

  useEffect(() => { if (logueado) { cargarTodo(); } }, [logueado]);

  const cargarTodo = async () => {
    setCargando(true);
    const { data: prodData } = await supabase.from("productos").select("*");
    if (prodData) setProductos(prodData);
    const { data: catData } = await supabase.from("categorias").select("*").order("Nombre", { ascending: true });
    if (catData) {
      setListadoCategorias(catData);
      if (catData.length > 0 && !nuevo.categoria) {
        setNuevo(prev => ({ ...prev, categoria: catData[0].Nombre }));
      }
    }
    setCargando(false);
  };

  const mostrarToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const login = () => {
    if (clave === CLAVE) { setLogueado(true); setError(""); }
    else setError("Clave incorrecta");
  };

  const agregarCategoria = async () => {
    if (!nuevaCatNombre.trim()) { mostrarToast("Escribi un nombre"); return; }
    const { error } = await supabase.from("categorias").insert({ Nombre: nuevaCatNombre.trim() });
    if (error) { mostrarToast("Ya existe esa categoria"); return; }
    mostrarToast("Categoria creada");
    setNuevaCatNombre("");
    cargarTodo();
  };

  const borrarCategoria = async (id: number) => {
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) { mostrarToast("No se pudo borrar"); return; }
    mostrarToast("Categoria eliminada");
    cargarTodo();
  };

  const subirFoto = async (file: File, campo: string) => {
    setSubiendo(true);
    const nombre = Date.now() + "-" + file.name;
    const { error } = await supabase.storage.from("productos").upload(nombre, file);
    if (error) { mostrarToast("Error al subir foto"); setSubiendo(false); return; }
    const { data } = supabase.storage.from("productos").getPublicUrl(nombre);
    if (editando) {
      setEditando(prev => prev ? { ...prev, [campo]: data.publicUrl } : null);
    } else {
      setNuevo(prev => ({ ...prev, [campo]: data.publicUrl }));
    }
    setSubiendo(false);
    mostrarToast("Foto subida");
  };

  const agregar = async () => {
    if (!nuevo.nombre || !nuevo.precio) { mostrarToast("Completa nombre y precio"); return; }
    const { error } = await supabase.from("productos").insert({
      nombre: nuevo.nombre,
      descripcion: nuevo.descripcion,
      precio: parseInt(nuevo.precio),
      emoji: nuevo.emoji,
      imagen: nuevo.imagen,
      imagen2: nuevo.imagen2,
      imagen3: nuevo.imagen3,
      categoria: nuevo.categoria,
      stock: parseInt(nuevo.stock) || 0,
      activo: true,
    });
    if (error) { mostrarToast("Error al guardar: " + error.message); return; }
    mostrarToast("Producto agregado");
    setNuevo({ nombre: "", descripcion: "", precio: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: listadoCategorias[0]?.Nombre || "", stock: "0" });
    cargarTodo();
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    const { error } = await supabase.from("productos").update({
      nombre: editando.nombre,
      descripcion: editando.descripcion,
      precio: editando.precio,
      emoji: editando.emoji,
      imagen: editando.imagen,
      imagen2: editando.imagen2,
      imagen3: editando.imagen3,
      categoria: editando.categoria,
      stock: editando.stock,
    }).eq("id", editando.id);
    if (error) { mostrarToast("Error al guardar"); return; }
    mostrarToast("Producto actualizado");
    setEditando(null);
    cargarTodo();
  };

  const toggleActivo = async (id: number, activo: boolean) => {
    await supabase.from("productos").update({ activo: !activo }).eq("id", id);
    cargarTodo();
  };

  const eliminarProducto = async (id: number) => {
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) { mostrarToast("No se pudo eliminar"); return; }
    mostrarToast("Producto eliminado");
    cargarTodo();
  };

  const actualizarStock = async (id: number, stockActual: number, cambio: number) => {
    const nuevoStock = Math.max(0, stockActual + cambio);
    await supabase.from("productos").update({ stock: nuevoStock }).eq("id", id);
    cargarTodo();
  };

  const compartirWhatsApp = (p: Producto) => {
    const msg = "Mira este producto de CARITO.SHOP!\n" + p.nombre + "\n$" + p.precio.toLocaleString("es-AR") + "\n" + p.descripcion + "\nVer mas en: carito-shop.vercel.app";
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  const neon = { color: "#ff2d78", textShadow: "0 0 10px #ff2d78" };

  const inputStyle = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 13, boxSizing: "border-box" as const };

  if (!logueado) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 40, width: 320, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <h2 style={{ ...neon, fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Panel Admin</h2>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>CARITO.SHOP</p>
        <input type="password" placeholder="Ingresa tu clave secreta" value={clave}
          onChange={e => setClave(e.target.value)} onKeyDown={e => e.key === "Enter" && login()}
          style={{ ...inputStyle, marginBottom: 12, border: "1px solid #ff2d78" }} />
        {error && <div style={{ color: "#ff2d78", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button onClick={login} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
          Entrar
        </button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "sans-serif", padding: 20 }}>
      {toast !== "" && (
        <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: "#ff2d78", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* MODAL EDITAR PRODUCTO */}
      {editando && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setEditando(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} />
          <div style={{ position: "relative", background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ ...neon, fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Editar producto</h2>

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Nombre</div>
              <input value={editando.nombre} onChange={e => setEditando(p => p ? { ...p, nombre: e.target.value } : null)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Descripcion</div>
              <textarea value={editando.descripcion} onChange={e => setEditando(p => p ? { ...p, descripcion: e.target.value } : null)} rows={3}
                style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Precio</div>
                <input type="number" value={editando.precio} onChange={e => setEditando(p => p ? { ...p, precio: parseInt(e.target.value) } : null)} style={inputStyle} />
              </div>
              <div>
                <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Stock</div>
                <input type="number" value={editando.stock} onChange={e => setEditando(p => p ? { ...p, stock: parseInt(e.target.value) } : null)} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Categoria</div>
              <select value={editando.categoria} onChange={e => setEditando(p => p ? { ...p, categoria: e.target.value } : null)} style={inputStyle}>
                {listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}
              </select>
            </div>

            {/* FOTOS */}
            {["imagen", "imagen2", "imagen3"].map((campo, i) => (
              <div key={campo} style={{ marginBottom: 12 }}>
                <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>{"Foto " + (i + 1) + (i === 0 ? " (principal)" : " (opcional)")}</div>
                {editando[campo as keyof Producto] && (
                  <img src={editando[campo as keyof Producto] as string} style={{ height: 80, borderRadius: 8, objectFit: "cover", marginBottom: 6, display: "block" }} />
                )}
                <input type="file" accept="image/*" onChange={e => e.target.files && subirFoto(e.target.files[0], campo)}
                  style={{ ...inputStyle, color: "#888", fontSize: 12 }} />
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditando(null)} style={{ flex: 1, padding: 13, background: "#222", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={guardarEdicion} style={{ flex: 2, padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div>
            <h1 style={{ ...neon, fontSize: 24, fontWeight: 900 }}>Panel Admin</h1>
            <p style={{ color: "#555", fontSize: 13 }}>CARITO.SHOP</p>
          </div>
          <a href="/" style={{ color: "#ff2d78", fontSize: 13, textDecoration: "none" }}>Ver tienda</a>
        </div>

        {/* CATEGORIAS */}
        <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24, marginBottom: 30 }}>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Gestionar Categorias</h2>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input value={nuevaCatNombre} onChange={e => setNuevaCatNombre(e.target.value)}
              placeholder="Nueva categoria" style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 13 }} />
            <button onClick={agregarCategoria} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              + Agregar
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {listadoCategorias.map(cat => (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#222", padding: "6px 12px", borderRadius: 20, border: "1px solid #333" }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{cat.Nombre}</span>
                <button onClick={() => borrarCategoria(cat.id)} style={{ background: "none", border: "none", color: "#ff2d78", cursor: "pointer", fontWeight: 800, fontSize: 14 }}>x</button>
              </div>
            ))}
          </div>
        </div>

        {/* AGREGAR PRODUCTO */}
        <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24, marginBottom: 30 }}>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Agregar producto</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Nombre</div>
              <input value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del producto" style={inputStyle} />
            </div>
            <div>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Precio</div>
              <input value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} placeholder="25000" type="number" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Descripcion</div>
            <textarea value={nuevo.descripcion} onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripcion del producto" rows={2} style={{ ...inputStyle, resize: "none" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Categoria</div>
              <select value={nuevo.categoria} onChange={e => setNuevo(p => ({ ...p, categoria: e.target.value }))} style={inputStyle}>
                {listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Stock inicial</div>
              <input value={nuevo.stock} onChange={e => setNuevo(p => ({ ...p, stock: e.target.value }))} placeholder="0" type="number" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Emoji</div>
              <input value={nuevo.emoji} onChange={e => setNuevo(p => ({ ...p, emoji: e.target.value }))} placeholder="🛍️" style={{ ...inputStyle, fontSize: 20 }} />
            </div>
          </div>
          {["imagen", "imagen2", "imagen3"].map((campo, i) => (
            <div key={campo} style={{ marginBottom: 12 }}>
              <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>{"Foto " + (i + 1) + (i === 0 ? " (principal)" : " (opcional)")}</div>
              {nuevo[campo as keyof typeof nuevo] && (
                <img src={nuevo[campo as keyof typeof nuevo]} style={{ height: 80, borderRadius: 8, objectFit: "cover", marginBottom: 6, display: "block" }} />
              )}
              <input type="file" accept="image/*" onChange={e => e.target.files && subirFoto(e.target.files[0], campo)}
                style={{ ...inputStyle, color: "#888", fontSize: 12 }} />
            </div>
          ))}
          {subiendo && <div style={{ color: "#ff2d78", fontSize: 13, marginBottom: 12 }}>Subiendo foto...</div>}
          <button onClick={agregar} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
            Publicar producto
          </button>
        </div>

        {/* LISTADO PRODUCTOS */}
        <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24 }}>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 20 }}>{"Mis productos (" + productos.length + ")"}</h2>
          {cargando && <div style={{ color: "#ff2d78", textAlign: "center", padding: 40 }}>Cargando...</div>}
          {productos.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderBottom: "1px solid #222" }}>
              <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.imagen ? <img src={p.imagen} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 30 }}>{p.emoji}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{p.nombre}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                  <div style={{ color: "#ff2d78", fontWeight: 800, fontSize: 13 }}>{"$" + p.precio.toLocaleString("es-AR")}</div>
                  <span style={{ fontSize: 10, background: "#222", color: "#aaa", padding: "2px 6px", borderRadius: 4 }}>{p.categoria || "Sin cat."}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <button onClick={() => actualizarStock(p.id, p.stock, -1)} style={{ background: "#333", border: "none", color: "#fff", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontWeight: 800 }}>-</button>
                  <span style={{ color: "#fff", fontSize: 12 }}>{"Stock: " + (p.stock || 0)}</span>
                  <button onClick={() => actualizarStock(p.id, p.stock, 1)} style={{ background: "#333", border: "none", color: "#fff", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontWeight: 800 }}>+</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                <button onClick={() => setEditando(p)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: "#1D4ED8", color: "#fff" }}>
                  Editar
                </button>
                <button onClick={() => toggleActivo(p.id, p.activo)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: p.activo ? "#10B981" : "#374151", color: "#fff" }}>
                  {p.activo ? "Activo" : "Inactivo"}
                </button>
                <button onClick={() => compartirWhatsApp(p)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: "#25D366", color: "#fff" }}>
                  Compartir
                </button>
                <button onClick={() => eliminarProducto(p.id)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: "#7F1D1D", color: "#fff" }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}