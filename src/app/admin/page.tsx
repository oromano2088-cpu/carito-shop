"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

type Producto = { 
  id: number; 
  nombre: string; 
  descripcion: string; 
  precio: number; 
  precio_oferta: number | null; 
  oferta_hasta: string | null; 
  emoji: string; 
  activo: boolean; 
  imagen: string; 
  imagen2: string; 
  imagen3: string; 
  categoria: string; 
  stock: number; 
};

type Categoria = { id: number; Nombre: string; };

type Pedido = {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  productos: string;
  total: number;
  estado_pago: 'pendiente_pago' | 'pagado';
  estado_entrega: 'pendiente_entrega' | 'entregado';
  aprobado: boolean;
  creado_en: string;
  es_financiado?: boolean;
  cuotas_totales?: number;
  cuotas_pagadas?: number;
  monto_cuota?: number;
  anticipo?: number;
};

type Reporte = {
  mes: string;
  total_pedidos: number;
  total_cobrado: number;
  total_deuda: number;
  ventas_totales: number;
};

const CLAVE = "carito2026";
const neon = { color: "#ff2d78", textShadow: "0 0 10px #ff2d78" };
const inputStyle = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 13, boxSizing: "border-box" as const };

export default function AdminUnificado() {
  // LÓGICA DE LOGIN ORIGINAL
  const [logueado, setLogueado] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  // PESTAÑA ACTIVA: 'productos' o 'pedidos'
  const [pestana, setPestana] = useState<'productos' | 'pedidos'>('productos');

  // ESTADOS ORIGINALES DE PRODUCTOS Y CATEGORÍAS
  const [productos, setProductos] = useState<Producto[]>([]);
  const [listadoCategorias, setListadoCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: "", stock: "0" });
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [toast, setToast] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);

  // ESTADOS NUEVOS PARA GESTIÓN COMERCIAL
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [filtroMes, setFiltroMes] = useState<string>("Todos");
  const [pedidoFinanciando, setPedidoFinanciando] = useState<number | null>(null);
  const [planCuotas, setPlanCuotas] = useState({ cantidad: 3, anticipo: 200000, recargoPorCuota: 10 });

  useEffect(() => { if (logueado) { cargarTodo(); } }, [logueado]);

  const cargarTodo = async () => {
    setCargando(true);
    
    // Cargar Catálogo Original
    const { data: prodData } = await supabase.from("productos").select("*").order("id", { ascending: false });
    if (prodData) setProductos(prodData);
    
    const { data: catData } = await supabase.from("categorias").select("*").order("Nombre", { ascending: true });
    if (catData) {
      setListadoCategorias(catData);
      if (catData.length > 0 && !nuevo.categoria) {
        setNuevo(prev => ({ ...prev, categoria: catData[0].Nombre }));
      }
    }

    // Cargar Pedidos y Balance Comercial
    const { data: pData } = await supabase.from("pedidos").select("*").order("creado_en", { ascending: false });
    if (pData) setPedidos(pData);

    const { data: rData } = await supabase.from("reporte_mensual").select("*");
    if (rData) setReportes(rData);

    setCargando(false);
  };

  const mostrarToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  
  const login = () => {
    if (clave === CLAVE) { setLogueado(true); setError(""); }
    else setError("Clave incorrecta");
  };

  // FUNCIONES DE CONTROL ORIGINALES
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
      precio_oferta: nuevo.precio_oferta ? parseInt(nuevo.precio_oferta) : null,
      oferta_hasta: nuevo.oferta_hasta ? nuevo.oferta_hasta : null,
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
    setNuevo({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: listadoCategorias[0]?.Nombre || "", stock: "0" });
    cargarTodo();
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    const { error } = await supabase.from("productos").update({
      nombre: editando.nombre,
      descripcion: editando.descripcion,
      precio: editando.precio,
      precio_oferta: editando.precio_oferta ? editando.precio_oferta : null,
      oferta_hasta: editando.oferta_hasta ? editando.oferta_hasta : null,
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

  // NUEVAS LOGICAS DE CONTROL COMERCIAL Y DEUDAS
  const calcularCuotaRedonda = (total: number, anticipo: number, cuotas: number, recargo: number) => {
    if (cuotas <= 1) return total - anticipo;
    const montoFinanciar = total - anticipo;
    const baseCuota = montoFinanciar / (cuotas - 1);
    const conRecargo = baseCuota * (1 + recargo / 100);
    return Math.ceil(conRecargo / 1000) * 1000; // Redondeo automático hacia arriba al siguiente billete de $1000
  };

  const aprobarPedido = async (pedido: Pedido) => {
    if (pedido.aprobado) return;
    const confirmar = window.confirm(`¿Aprobar pedido de ${pedido.cliente_nombre}? Esto descontará las unidades físicas del stock.`);
    if (!confirmar) return;

    const items = pedido.productos.split(", ");
    for (const item of items) {
      const partes = item.split(" x");
      if (partes.length === 2) {
        const nombreProducto = partes[0].trim();
        const cantidadRestar = parseInt(partes[1]);

        const { data: prod } = await supabase.from("productos").select("id, stock").eq("nombre", nombreProducto).single();
        if (prod) {
          const nuevoStock = Math.max(0, prod.stock - cantidadRestar);
          await supabase.from("productos").update({ stock: nuevoStock }).eq("id", prod.id);
        }
      }
    }

    await supabase.from("pedidos").update({ aprobado: true }).eq("id", pedido.id);
    mostrarToast("Stock descontado con éxito");
    cargarTodo();
  };

  const cambiarEstadoPago = async (id: number, nuevoEstado: 'pendiente_pago' | 'pagado') => {
    await supabase.from("pedidos").update({ estado_pago: nuevoEstado }).eq("id", id);
    cargarTodo();
  };

  const cambiarEstadoEntrega = async (id: number, nuevoEstado: 'pendiente_entrega' | 'entregado') => {
    await supabase.from("pedidos").update({ estado_entrega: nuevoEstado }).eq("id", id);
    cargarTodo();
  };

  const aplicarFinanciacion = async (id: number, total: number) => {
    const valorCuota = calcularCuotaRedonda(total, planCuotas.anticipo, planCuotas.cantidad, planCuotas.recargoPorCuota);
    await supabase.from("pedidos").update({
      es_financiado: true,
      anticipo: planCuotas.anticipo,
      cuotas_totales: planCuotas.cantidad,
      cuotas_pagadas: 1,
      monto_cuota: valorCuota,
      total: planCuotas.anticipo + (valorCuota * (planCuotas.cantidad - 1))
    }).eq("id", id);

    setPedidoFinanciando(null);
    mostrarToast("Plan de cuotas aplicado");
    cargarTodo();
  };

  const pagarCuota = async (pedido: Pedido) => {
    const pagadas = (pedido.cuotas_pagadas || 0) + 1;
    const totales = pedido.cuotas_totales || 3;
    const actualizar: any = { cuotas_pagadas: pagadas };
    if (pagadas >= totales) {
      actualizar.estado_pago = 'pagado';
    }
    await supabase.from("pedidos").update(actualizar).eq("id", pedido.id);
    cargarTodo();
  };

  // CONTROL DE REPORTES MENSUALES
  const mesesDisponibles = Array.from(new Set(pedidos.map(p => p.creado_en.substring(0, 7))));
  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroMes === "Todos") return true;
    return p.creado_en.startsWith(filtroMes);
  });

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

      {/* MODAL EDITAR PRODUCTO ORIGINAL */}
      {editando && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setEditando(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} />
          <div style={{ position: "relative", background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24, width: "90%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ ...neon, fontSize: 20, fontWeight: 900, marginBottom: 20 }}>Editar producto</h2>
            <div style={{ marginBottom: 12 }}><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Nombre</div><input value={editando.nombre} onChange={e => setEditando(p => p ? { ...p, nombre: e.target.value } : null)} style={inputStyle} /></div>
            <div style={{ marginBottom: 12 }}><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Descripcion</div><textarea value={editando.descripcion} onChange={e => setEditando(p => p ? { ...p, descripcion: e.target.value } : null)} rows={3} style={{ ...inputStyle, resize: "none" }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Precio Normal ($)</div><input type="number" value={editando.precio} onChange={e => setEditando(p => p ? { ...p, precio: parseInt(e.target.value) } : null)} style={inputStyle} /></div>
              <div><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Stock</div><input type="number" value={editando.stock} onChange={e => setEditando(p => p ? { ...p, stock: parseInt(e.target.value) } : null)} style={inputStyle} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><div style={{ color: "#ff2d78", fontSize: 12, marginBottom: 6, fontWeight: "bold" }}>Precio Oferta</div><input type="number" value={editando.precio_oferta || ""} onChange={e => setEditando(p => p ? { ...p, precio_oferta: e.target.value ? parseInt(e.target.value) : null } : null)} style={inputStyle} /></div>
              <div><div style={{ color: "#ff2d78", fontSize: 12, marginBottom: 6, fontWeight: "bold" }}>Oferta hasta</div><input type="datetime-local" value={editando.oferta_hasta ? editando.oferta_hasta.substring(0,16) : ""} onChange={e => setEditando(p => p ? { ...p, oferta_hasta: e.target.value ? e.target.value : null } : null)} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Categoria</div><select value={editando.categoria} onChange={e => setEditando(p => p ? { ...p, categoria: e.target.value } : null)} style={inputStyle}>{listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}</select></div>
            {["imagen", "imagen2", "imagen3"].map((campo, i) => (
              <div key={campo} style={{ marginBottom: 12 }}>
                <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>{"Foto " + (i + 1)}</div>
                {editando[campo as keyof Producto] && <img src={editando[campo as keyof Producto] as string} style={{ height: 80, borderRadius: 8, objectFit: "cover", marginBottom: 6, display: "block" }} />}
                <input type="file" accept="image/*" onChange={e => e.target.files && subirFoto(e.target.files[0], campo)} style={{ ...inputStyle, color: "#888", fontSize: 12 }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditando(null)} style={{ flex: 1, padding: 13, background: "#222", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardarEdicion} style={{ flex: 2, padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer" }}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN SUPERIOR (SELECTOR DE PESTAÑAS) */}
      <div style={{ maxWidth: 1100, margin: "0 auto 30px auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222", paddingBottom: 16 }}>
        <div>
          <h1 style={{ ...neon, fontSize: 26, fontWeight: 900, margin: 0 }}>Panel de Control Comercial</h1>
          <p style={{ margin: "4px 0 0 0", color: "#555", fontSize: 13 }}>Administración integral de CARITO.SHOP</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setPestana('productos')} style={{ padding: "10px 18px", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", background: pestana === 'productos' ? "#ff2d78" : "#222", color: "#fff" }}>
            📦 Productos y Categorías
          </button>
          <button onClick={() => setPestana('pedidos')} style={{ padding: "10px 18px", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer", background: pestana === 'pedidos' ? "#ff2d78" : "#222", color: "#fff", boxShadow: pestana === 'pedidos' ? "0 0 10px rgba(255,45,120,0.4)" : "none" }}>
            📈 Control de Pedidos y Cuotas ({pedidos.filter(p=>!p.aprobado).length} nuevos)
          </button>
          <a href="/" style={{ background: "transparent", border: "1px solid #333", color: "#aaa", padding: "10px 16px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>Ver tienda 🛍️</a>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        
        {/* ========================================= PESTAÑA PRODUCTOS (TU PANEL ORIGINAL) ========================================= */}
        {pestana === 'productos' && (
          <div>
            {/* CATEGORIAS */}
            <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24, marginBottom: 30 }}>
              <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Gestionar Categorias</h2>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input value={nuevaCatNombre} onChange={e => setNuevaCatNombre(e.target.value)} placeholder="Nueva categoria" style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0a0a0a", color: "#fff", fontSize: 13 }} />
                <button onClick={agregarCategoria} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>+ Agregar</button>
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
                <div><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Nombre</div><input value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del producto" style={inputStyle} /></div>
                <div><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Precio Normal</div><input value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} placeholder="25000" type="number" style={inputStyle} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><div style={{ color: "#ff2d78", fontSize: 12, marginBottom: 6, fontWeight: "bold" }}>Precio de Oferta (Opcional)</div><input value={nuevo.precio_oferta} onChange={e => setNuevo(p => ({ ...p, precio_oferta: e.target.value }))} placeholder="Ej: 20000" type="number" style={inputStyle} /></div>
                <div><div style={{ color: "#ff2d78", fontSize: 12, marginBottom: 6, fontWeight: "bold" }}>Oferta válida hasta</div><input value={nuevo.oferta_hasta} onChange={e => setNuevo(p => ({ ...p, oferta_hasta: e.target.value }))} type="datetime-local" style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Descripcion</div><textarea value={nuevo.descripcion} onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripcion del producto" rows={2} style={{ ...inputStyle, resize: "none" }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Categoria</div><select value={nuevo.categoria} onChange={e => setNuevo(p => ({ ...p, categoria: e.target.value }))} style={inputStyle}>{listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}</select></div>
                <div><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Stock inicial</div><input value={nuevo.stock} onChange={e => setNuevo(p => ({ ...p, stock: e.target.value }))} placeholder="0" type="number" style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>Emoji</div><input value={nuevo.emoji} onChange={e => setNuevo(p => ({ ...p, emoji: e.target.value }))} placeholder="🛍️" style={{ ...inputStyle, fontSize: 20 }} /></div>
              {["imagen", "imagen2", "imagen3"].map((campo, i) => (
                <div key={campo} style={{ marginBottom: 12 }}>
                  <div style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>{"Foto " + (i + 1)}</div>
                  {nuevo[campo as keyof typeof nuevo] && <img src={nuevo[campo as keyof typeof nuevo]} style={{ height: 80, borderRadius: 8, objectFit: "cover", marginBottom: 6, display: "block" }} />}
                  <input type="file" accept="image/*" onChange={e => e.target.files && subirFoto(e.target.files[0], campo)} style={{ ...inputStyle, color: "#888", fontSize: 12 }} />
                </div>
              ))}
              {subiendo && <div style={{ color: "#ff2d78", fontSize: 13, marginBottom: 12 }}>Subiendo foto...</div>}
              <button onClick={agregar} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Publicar producto</button>
            </div>

            {/* LISTADO PRODUCTOS */}
            <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 24 }}>
              <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Mis productos ({productos.length})</h2>
              {cargando && <div style={{ color: "#ff2d78", textAlign: "center", padding: 40 }}>Cargando...</div>}
              {productos.map(p => (
                <div key={p.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderBottom: "1px solid #222" }}>
                  <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.imagen ? <img src={p.imagen} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 30 }}>{p.emoji}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{p.nombre}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                      <div style={{ color: "#ff2d78", fontWeight: 800, fontSize: 14 }}>{p.precio_oferta ? `OFERTA: $${p.precio_oferta.toLocaleString("es-AR")}` : `$${p.precio.toLocaleString("es-AR")}`}</div>
                      {p.precio_oferta && <span style={{ fontSize: 11, color: "#555", textDecoration: "line-through" }}>${p.precio.toLocaleString("es-AR")}</span>}
                      <span style={{ fontSize: 10, background: "#222", color: "#aaa", padding: "2px 6px", borderRadius: 4 }}>{p.categoria || "Sin cat."}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <button onClick={() => actualizarStock(p.id, p.stock, -1)} style={{ background: "#333", border: "none", color: "#fff", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontWeight: 800 }}>-</button>
                      <span style={{ color: "#fff", fontSize: 12 }}>Stock: {p.stock || 0}</span>
                      <button onClick={() => actualizarStock(p.id, p.stock, 1)} style={{ background: "#333", border: "none", color: "#fff", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontWeight: 800 }}>+</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => setEditando(p)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: "#1D4ED8", color: "#fff" }}>Editar</button>
                    <button onClick={() => toggleActivo(p.id, p.activo)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: p.activo ? "#10B981" : "#374151", color: "#fff" }}>{p.activo ? "Activo" : "Inactivo"}</button>
                    <button onClick={() => compartirWhatsApp(p)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: "#25D366", color: "#fff" }}>Compartir</button>
                    <button onClick={() => eliminarProducto(p.id)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: "#7F1D1D", color: "#fff" }}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================= PESTAÑA PEDIDOS (SISTEMA DE CONTROL FINANCIERO) ========================================= */}
        {pestana === 'pedidos' && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
            
            {/* LISTADO DE SOLICITUDES DE CLIENTES */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, margin: 0, fontWeight: 800 }}>Ordenes Recibidas</h2>
                <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} style={{ background: "#111", color: "#fff", border: "1px solid #ff2d78", padding: "6px 12px", borderRadius: 8, fontSize: 13 }}>
                  <option value="Todos">Ver Todos los Pedidos</option>
                  {mesesDisponibles.map(m => <option key={m} value={m}>Mes: {m}</option>)}
                </select>
              </div>

              {pedidosFiltrados.length === 0 ? (
                <div style={{ background: "#111", borderRadius: 16, padding: 40, textAlign: "center", color: "#555", border: "1px dashed #222" }}>No hay registros en este bloque.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {pedidosFiltrados.map((p) => {
                    const saldoRestante = p.es_financiado 
                      ? ((p.cuotas_totales || 0) - (p.cuotas_pagadas || 0)) * (p.monto_cuota || 0)
                      : (p.estado_pago === 'pendiente_pago' ? p.total : 0);

                    return (
                      <div key={p.id} style={{ background: "#111", borderRadius: 16, border: p.aprobado ? "1px solid #222" : "2px solid #ff2d78", padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div>
                            <span style={{ fontSize: 11, color: "#444", marginRight: 8 }}>#{p.id}</span>
                            <span style={{ fontSize: 11, color: "#ff2d78", background: "rgba(255,45,120,0.1)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{new Date(p.creado_en).toLocaleDateString("es-AR")}</span>
                            <h3 style={{ margin: "6px 0 2px 0", fontSize: 16, fontWeight: 800 }}>{p.cliente_nombre}</h3>
                            <p style={{ margin: 0, fontSize: 12, color: "#777" }}>📞 {p.cliente_telefono} | 📍 {p.cliente_direccion || "Retira por Local"}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 16, fontWeight: 900 }}>${p.total.toLocaleString("es-AR")}</div>
                            {saldoRestante > 0 ? <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 700, marginTop: 2 }}>Debe: ${saldoRestante.toLocaleString("es-AR")}</div> : <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginTop: 2 }}>✓ Totalmente Saldado</div>}
                          </div>
                        </div>

                        <div style={{ background: "#0a0a0a", padding: "8px 12px", borderRadius: 8, fontSize: 13, color: "#bbb", border: "1px solid #1a1a1a", marginBottom: 12 }}>
                          <strong>Productos:</strong> {p.productos}
                        </div>

                        {/* DESGLOSE PLAN DE FINANCIACIÓN PROPIA */}
                        {p.es_financiado && (
                          <div style={{ background: "rgba(255,45,120,0.02)", border: "1px solid rgba(255,45,120,0.15)", padding: 12, borderRadius: 8, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 12 }}>
                              <span style={{ color: "#ff2d78", fontWeight: 700 }}>📈 Financiación Activa:</span> Cuotas pagas: <strong>{p.cuotas_pagadas}/{p.cuotas_totales}</strong> (Valor Cuota c/ recargo redondeado: <strong>${p.monto_cuota?.toLocaleString("es-AR")}</strong>)
                            </div>
                            {p.estado_pago !== 'pagado' && (
                              <button onClick={() => pagarCuota(p)} style={{ background: "#ff2d78", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⚡ Cobrar Cuota</button>
                            )}
                          </div>
                        )}

                        {/* ACCIONES DE CONTROLADOR */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", paddingTop: 12, borderTop: "1px solid #1f1f1f" }}>
                          {!p.aprobado ? (
                            <button onClick={() => aprobarPedido(p)} style={{ background: "linear-gradient(135deg, #ff2d78, #ff0055)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>✔️ Aprobar y Bajar Stock</button>
                          ) : (
                            <span style={{ fontSize: 11, color: "#444", background: "#1a1a1a", padding: "6px 10px", borderRadius: 6, fontWeight: 700 }}>📦 Stock Descontado</span>
                          )}
                          <div style={{ flex: 1 }} />
                          
                          <select value={p.estado_pago} onChange={(e) => cambiarEstadoPago(p.id, e.target.value as any)} style={{ background: p.estado_pago === 'pagado' ? "#064e3b" : "#111", color: p.estado_pago === 'pagado' ? "#10B981" : "#aaa", border: "1px solid #222", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>
                            <option value="pendiente_pago">❌ Pendiente Pago</option>
                            <option value="pagado">💰 Pagado Total</option>
                          </select>

                          <select value={p.estado_entrega} onChange={(e) => cambiarEstadoEntrega(p.id, e.target.value as any)} style={{ background: p.estado_entrega === 'entregado' ? "#1e3a8a" : "#111", color: p.estado_entrega === 'entregado' ? "#3B82F6" : "#aaa", border: "1px solid #222", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>
                            <option value="pendiente_entrega">🚚 Pendiente Entrega</option>
                            <option value="entregado">🏠 Entregado</option>
                          </select>

                          {!p.es_financiado && (
                            <button onClick={() => { setPedidoFinanciando(p.id); setPlanCuotas({ cantidad: 3, anticipo: Math.floor(p.total * 0.3), recargoPorCuota: 10 }); }} style={{ background: "transparent", color: "#ff2d78", border: "1px solid #ff2d78", padding: "4px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>📈 Financiar</button>
                          )}
                        </div>

                        {/* PANEL FINANCIADOR INTERNO */}
                        {pedidoFinanciando === p.id && (
                          <div style={{ marginTop: 12, background: "#050505", border: "1px dashed #ff2d78", padding: 12, borderRadius: 8 }}>
                            <h4 style={{ margin: "0 0 8px 0", fontSize: 12, color: "#ff2d78" }}>Calculadora de Cuotas con Redondeo hacia arriba</h4>
                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                              <label style={{ fontSize: 11, color: "#666" }}>Cuotas Totales: <input type="number" value={planCuotas.cantidad} onChange={e => setPlanCuotas(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))} style={{ width: 50, background: "#111", border: "1px solid #333", color: "#fff", padding: 4, borderRadius: 4 }} /></label>
                              <label style={{ fontSize: 11, color: "#666" }}>Anticipo Inicial $: <input type="number" value={planCuotas.anticipo} onChange={e => setPlanCuotas(prev => ({ ...prev, anticipo: parseInt(e.target.value) || 0 }))} style={{ width: 90, background: "#111", border: "1px solid #333", color: "#fff", padding: 4, borderRadius: 4 }} /></label>
                              <label style={{ fontSize: 11, color: "#666" }}>% Recargo: <input type="number" value={planCuotas.recargoPorCuota} onChange={e => setPlanCuotas(prev => ({ ...prev, recargoPorCuota: parseInt(e.target.value) || 0 }))} style={{ width: 50, background: "#111", border: "1px solid #333", color: "#fff", padding: 4, borderRadius: 4 }} /></label>
                            </div>
                            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
                              Plan: Entrega de <strong>${planCuotas.anticipo.toLocaleString("es-AR")}</strong> + {(planCuotas.cantidad - 1)} cuotas fijas con redondeo de <strong>${calcularCuotaRedonda(p.total, planCuotas.anticipo, planCuotas.cantidad, planCuotas.recargoPorCuota).toLocaleString("es-AR")}</strong>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => aplicarFinanciacion(p.id, p.total)} style={{ background: "#ff2d78", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Confirmar Plan</button>
                              <button onClick={() => setPedidoFinanciando(null)} style={{ background: "none", color: "#444", border: "none", fontSize: 11, cursor: "pointer" }}>Cerrar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMNA LATERAL - BALANCE DE COMPRAS Y TOTALES */}
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 20, fontWeight: 800 }}>📊 Balance de Caja</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {reportes.map((r, i) => (
                  <div key={i} style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #222" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#ff2d78", marginBottom: 8, borderBottom: "1px solid #222", paddingBottom: 4 }}>📅 Período: {r.mes}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#555" }}>Pedidos:</span><strong>{r.total_pedidos}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#555" }}>Ventas totales:</span><strong>${r.ventas_totales.toLocaleString("es-AR")}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#10B981" }}>Cobrado real:</span><strong style={{ color: "#10B981" }}>${r.total_cobrado.toLocaleString("es-AR")}</strong></div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4, borderTop: "1px dashed #222" }}><span style={{ color: "#EF4444" }}>Deuda en la calle:</span><strong style={{ color: "#EF4444" }}>${r.total_deuda.toLocaleString("es-AR")}</strong></div>
                    </div>
                  </div>
                ))}
                {reportes.length === 0 && <div style={{ color: "#444", fontSize: 12, textAlign: "center" }}>No hay balances procesados.</div>}
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}