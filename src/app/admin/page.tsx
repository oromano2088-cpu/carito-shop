"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

type Producto = { 
  id: number; nombre: string; descripcion: string; precio: number; precio_oferta: number | null; 
  oferta_hasta: string | null; emoji: string; activo: boolean; imagen: string; imagen2: string; 
  imagen3: string; categoria: string; stock: number; 
};
type Categoria = { id: number; Nombre: string; };
type Pedido = {
  id: number; cliente_nombre: string; cliente_telefono: string; cliente_direccion: string;
  productos: string; total: number; estado_pago: string; estado_entrega: string; 
  aprobado: boolean; creado_en: string; es_financiado?: boolean; cuotas_totales?: number; 
  cuotas_pagadas?: number; monto_cuota?: number; anticipo?: number; cuenta_ingreso: string;
  es_dropshipping?: boolean;
};
type Gasto = {
  id: number; distribuidora: string; monto: number; concepto: string;
  cuenta_salida: string; creado_en: string; comprobante_url?: string;
  tipo_movimiento?: string;
};
type Reporte = {
  mes: string; total_pedidos: number; total_cobrado: number; total_deuda: number;
  ventas_totales: number; total_gastos: number; ganancia_neta_real: number;
};

type ElementoHistorial = {
  fecha: string;
  entidad: string;
  concepto: string;
  monto: number;
  cuenta: string;
  esIngreso: boolean;
  comprobanteUrl?: string;
};

const CLAVE = "carito2026";
const neon = { color: "#ff2d78", textShadow: "0 0 10px #ff2d78" };
const inputStyle = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #222", background: "#111", color: "#fff", fontSize: 14, boxSizing: "border-box" as const, outline: "none" };
const buttonStyle = { width: "100%", padding: 14, background: "linear-gradient(135deg, #ff2d78, #ff0055)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" } as const;

export default function AdminMobileCompleto() {
  const [logueado, setLogueado] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [pestana, setPestana] = useState<'catalogo' | 'alta' | 'ventas' | 'caja' | 'cargar_venta'>('catalogo');
  const [cajas, setCajas] = useState({ alias: 0, brubankSenora: 0, efectivo: 0 });
  const [productos, setProductos] = useState<Producto[]>([]);
  const [listadoCategorias, setListadoCategorias] = useState<Categoria[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [historialUnificado, setHistorialUnificado] = useState<ElementoHistorial[]>([]);
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState("");
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: "", stock: "0" });
  const [creandoNuevaCat, setCreandoNuevaCat] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState("");
  const [coincidenciasAlta, setCoincidenciasAlta] = useState<Producto[]>([]);
  const [filtroMes, setFiltroMes] = useState<string>("Todos");
  const [mesesDisponibles, setMesesDisponibles] = useState<string[]>([]);
  const [confirmarEliminar, setConfirmarEliminar] = useState<Producto | null>(null);

  const [editandoDeudaId, setEditandoDeudaId] = useState<number | null>(null);
  const [nuevoSaldoDeuda, setNuevoSaldoDeuda] = useState("");

  const [ventaManual, setVentaManual] = useState({ 
    cliente: "", telephone: "", direccion: "", productoId: "", tipoPago: "Efectivo", esDropshipping: false, montoEntregado: "", telefono: ""
  });

  const [categoriaFiltroVenta, setCategoriaFiltroVenta] = useState("");
  const [categoriaAbierta, setCategoriaAbierta] = useState<string | null>(null);
  const [vistaProductoCompleto, setVistaProductoCompleto] = useState<Producto | null>(null);

  const [precioOfertaManual, setPrecioOfertaManual] = useState("");
  const [horasOfertaManual, setHorasOfertaManual] = useState("24");

  useEffect(() => { if (logueado) { cargarTodo(); } }, [logueado]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (logueado && pestana === "catalogo") {
        verificarOfertasExpiradas();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [logueado, productos, pestana]);

  const normalizarCuenta = (str: string): string => {
    if (!str) return "";
    const s = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[💵📱👩]/g, "").replace("caja:", "").replace("transferencia:", "").trim();
    if (s.includes("alias") || s.includes("carito")) return "alias";
    if (s.includes("brubank") || s.includes("senora") || s.includes("diario")) return "brubank";
    if (s.includes("efectivo")) return "efectivo";
    return s;
  };

  const verificarOfertasExpiradas = async () => {
    const ahora = new Date();
    let huboCambios = false;

    for (const p of productos) {
      if (p.oferta_hasta && p.precio_oferta !== null) {
        const limite = new Date(p.oferta_hasta);
        if (ahora >= limite) {
          huboCambios = true;
          await supabase.from("productos").update({
            precio_oferta: null,
            oferta_hasta: null
          }).eq("id", p.id);
        }
      }
    }

    if (huboCambios) {
      const { data: prodData } = await supabase.from("productos").select("*").order("id", { ascending: false });
      if (prodData) {
        setProductos(prodData);
        if (editando) {
          const u = prodData.find(x => x.id === editando.id);
          setEditando(u || null);
        }
      }
    }
  };

  const lanzarOfertaRelampagoGlobal = async (productoId: number) => {
    if (!precioOfertaManual) {
      mostrarToast("Especifica un precio de oferta");
      return;
    }

    const ahora = new Date();
    ahora.setHours(ahora.getHours() + Number(horasOfertaManual));
    const isoFechaLimite = adaptersIsoStringLocal(ahora);

    const { error } = await supabase.from("productos").update({
      precio_oferta: Number(precioOfertaManual),
      oferta_hasta: isoFechaLimite
    }).eq("id", productoId);

    if (error) {
      mostrarToast("Error al activar la oferta");
      return;
    }

    mostrarToast("¡Oferta Relámpago activada!");
    setPrecioOfertaManual("");
    cargarTodo();
  };

  const adaptersIsoStringLocal = (date: Date) => {
    const tzo = -date.getTimezoneOffset(),
      dif = tzo >= 0 ? '+' : '-',
      pad = (num: number) => {
        return (num < 10 ? '0' : '') + num;
      };
    return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds()) +
      dif + pad(Math.floor(Math.abs(tzo) / 60)) +
      ':' + pad(Math.abs(tzo) % 60);
  };

  const ejecutarRemoverOfertaManual = async (id: number) => {
    await supabase.from("productos").update({
      precio_oferta: null,
      oferta_hasta: null
    }).eq("id", id);

    mostrarToast("Oferta finalizada");
    cargarTodo();
  };

  const calcularTiempoRestanteString = (isoString: string | null): string => {
    if (!isoString) return "";
    const diferencia = new Date(isoString).getTime() - new Date().getTime();
    if (diferencia <= 0) return "Expirado";

    const totalSegundos = Math.floor(diferencia / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    return `${horas.toString().padStart(2, "0")}h ${minutos.toString().padStart(2, "0")}m ${segundos.toString().padStart(2, "0")}s`;
  };

  const cargarTodo = async () => {
    setCargando(true);
    const { data: prodData } = await supabase.from("productos").select("*").order("id", { ascending: false });
    if (prodData) {
      setProductos(prodData);
      if (editando) {
        const actualizadoEd = prodData.find(p => p.id === editando.id);
        setEditando(actualizadoEd || null);
      }
    }
    const { data: catData } = await supabase.from("categorias").select("*").order("Nombre", { ascending: true });
    if (catData) setListadoCategorias(catData);
    
    const { data: pData } = await supabase.from("pedidos").select("*").order("creado_en", { ascending: false });
    const listaPedidos = pData || [];
    setPedidos(listaPedidos);
    const meses = Array.from(new Set(listaPedidos.map((p: Pedido) => p.creado_en ? p.creado_en.substring(0, 7) : ""))) as string[];
    setMesesDisponibles(meses.filter(Boolean));
    
    const { data: gData } = await supabase.from("gastos_distribuidoras").select("*").order("creado_en", { ascending: false });
    setGastos(gData || []);
    const { data: rData } = await supabase.from("reporte_mensual").select("*");
    if (rData) setReportes(rData);
    
    let totalAlias = 0; let totalBrubank = 0; let totalEfectivo = 0;
    let poolHistorial: ElementoHistorial[] = [];
    
    listaPedidos.forEach((p: Pedido) => {
      const plataIngresadaEfectiva = p.estado_pago === 'pagado' ? p.total : (p.anticipo || 0);
      const tagCuenta = normalizarCuenta(p.cuenta_ingreso);

      if (plataIngresadaEfectiva > 0) {
        if (tagCuenta === "alias") totalAlias += plataIngresadaEfectiva;
        else if (tagCuenta === "brubank") totalBrubank += plataIngresadaEfectiva;
        else if (tagCuenta === "efectivo") totalEfectivo += plataIngresadaEfectiva;
      }

      if (p.aprobado && plataIngresadaEfectiva > 0) {
        poolHistorial.push({
          fecha: p.creado_en, entidad: p.cliente_nombre, concepto: p.productos, monto: plataIngresadaEfectiva, cuenta: p.cuenta_ingreso.includes(":") ? p.cuenta_ingreso : "💵 " + p.cuenta_ingreso, esIngreso: true
        });
      }
    });

    setHistorialUnificado(poolHistorial);
    setCajas({ alias: totalAlias, brubankSenora: totalBrubank, efectivo: totalEfectivo });
    setCargando(false);
  };

  const mostrarToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const login = () => { if (clave === CLAVE) setLogueado(true); else setError("Clave incorrecta"); };
  const toggleActivo = async (id: number, activo: boolean) => { 
    await supabase.from("productos").update({ activo: !activo }).eq("id", id); 
    mostrarToast(activo ? "Producto pausado y oculto" : "Producto activado y visible");
    cargarTodo(); 
  };
  const actualizarStock = async (id: number, stockActual: number, cambio: number) => { await supabase.from("productos").update({ stock: Math.max(0, stockActual + cambio) }).eq("id", id); cargarTodo(); };

  const eliminarProducto = async (id: number) => {
    await supabase.from("productos").delete().eq("id", id);
    setConfirmarEliminar(null);
    setEditando(null);
    mostrarToast("Producto eliminado del sistema");
    cargarTodo();
  };

  const handleCambioNombreAlta = (texto: string) => {
    setNuevo(prev => ({ ...prev, nombre: texto }));
    if (texto.trim().length < 2) { setCoincidenciasAlta([]); return; }
    setCoincidenciasAlta(productos.filter(p => p.nombre.toLowerCase().includes(texto.toLowerCase())));
  };

  const handleSeleccionarCategoria = (valor: string) => {
    if (valor === "NUEVA") setCreandoNuevaCat(true);
    else { setCreandoNuevaCat(false); setNuevo(prev => ({ ...prev, categoria: valor })); }
  };

  const ejecutarCrearCategoria = async () => {
    if (!nuevaCatNombre.trim()) return;
    const { error: catErr } = await supabase.from("categorias").insert({ Nombre: nuevaCatNombre.trim() });
    if (catErr) { mostrarToast("Ya existe esa categoria"); return; }
    mostrarToast("Categoria agregada");
    setNuevo(prev => ({ ...prev, categoria: nuevaCatNombre.trim() }));
    setNuevaCatNombre(""); setCreandoNuevaCat(false); cargarTodo();
  };

  const agregar = async () => {
    if (!nuevo.nombre || !nuevo.precio) { mostrarToast("Completa nombre y precio"); return; }
    await supabase.from("productos").insert({
      nombre: nuevo.nombre, descripcion: nuevo.descripcion, precio: parseInt(nuevo.precio),
      precio_oferta: nuevo.precio_oferta ? parseInt(nuevo.precio_oferta) : null,
      emoji: nuevo.emoji, imagen: nuevo.imagen, imagen2: nuevo.imagen2, imagen3: nuevo.imagen3,
      categoria: nuevo.categoria, stock: parseInt(nuevo.stock) || 0, activo: true,
    });
    mostrarToast("Producto publicado");
    setNuevo({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: listadoCategorias[0]?.Nombre || "", stock: "0" });
    setCoincidenciasAlta([]); setPestana('catalogo'); cargarTodo();
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    await supabase.from("productos").update({
      nombre: editando.nombre, descripcion: editando.descripcion, precio: editando.precio,
      precio_oferta: editando.precio_oferta, emoji: editando.emoji, imagen: editando.imagen,
      imagen2: editando.imagen2, imagen3: editando.imagen3, categoria: editando.categoria, stock: editando.stock,
    }).eq("id", editando.id);
    setEditando(null); mostrarToast("Producto actualizado"); cargarTodo();
  };

  const cambiarCuentaIngreso = async (id: number, nuevaCuenta: string) => { await supabase.from("pedidos").update({ cuenta_ingreso: nuevaCuenta }).eq("id", id); cargarTodo(); };
  const cambiarEstadoPago = async (id: number, nuevoEstado: string) => { 
    const updates: any = { estado_pago: nuevoEstado };
    if (nuevoEstado === 'pagado') { const p = pedidos.find(o => o.id === id); if (p) updates.anticipo = p.total; }
    await supabase.from("pedidos").update(updates).eq("id", id); 
    cargarTodo(); 
  };

  const ejecutarCargaVentaManual = async () => {
    if (!ventaManual.cliente || !ventaManual.productoId) { mostrarToast("Asigna cliente y producto"); return; }
    const prodSeleccionado = productos.find(p => p.id === parseInt(ventaManual.productoId));
    if (!prodSeleccionado) return;
    
    const precioBase = prodSeleccionado.precio_oferta || prodSeleccionado.precio;
    let totalCalculado = precioBase;
    let esFinanciado = false;
    let cuotasTotales = 1;
    let cuotasPagadas = 1;
    let montoCuota = 0;
    let anticipoCalculado = precioBase;
    let cuentaAsignada = ventaManual.tipoPago === 'Cuotas' ? 'Efectivo' : ventaManual.tipoPago;
    let estadoPagoFinal = 'pagado';

    if (ventaManual.tipoPago === "Cuotas") {
      esFinanciado = true; cuotasTotales = 3; cuotasPagadas = 1;
      const c1Base = precioBase / 3;
      anticipoCalculado = Math.ceil(c1Base / 1000) * 1000;
      montoCuota = Math.ceil((c1Base * 1.10) / 1000) * 1000;
      totalCalculado = anticipoCalculado + (montoCuota * 2);
      estadoPagoFinal = 'pendiente_pago';
    } else {
      const entregado = parseInt(ventaManual.montoEntregado);
      if (!isNaN(entregado)) {
        anticipoCalculado = entregado; 
        if (entregado < precioBase) { estadoPagoFinal = 'pendiente_pago'; }
      }
    }

    await supabase.from("pedidos").insert({
      cliente_nombre: ventaManual.cliente, cliente_telefono: ventaManual.telefono, cliente_direccion: ventaManual.direccion, productos: prodSeleccionado.nombre + " x1", total: totalCalculado, estado_pago: estadoPagoFinal, estado_entrega: 'pendiente_entrega', aprobado: false, es_financiado: esFinanciado, cuotas_totales: cuotasTotales, cuotas_pagadas: cuotasPagadas, monto_cuota: montoCuota, anticipo: anticipoCalculado, cuenta_ingreso: cuentaAsignada, es_dropshipping: ventaManual.esDropshipping,
    });
    
    mostrarToast("Venta registrada");
    setVentaManual({ cliente: "", telephone: "", direccion: "", productoId: "", tipoPago: "Efectivo", esDropshipping: false, montoEntregado: "", telefono: "" });
    setCategoriaFiltroVenta(""); 
    setPestana('ventas'); cargarTodo();
  };

  const ejecutarConfirmacionEntregaReal = async (pedido: Pedido) => {
    if (pedido.aprobado) return;
    if (!pedido.es_dropshipping) {
      const items = pedido.productos.split(", ");
      for (const item of items) {
        const partes = item.split(" x");
        if (partes.length === 2) {
          const nombreProducto = partes[0].trim();
          const cantidadRestar = parseInt(partes[1]);
          const { data: prod } = await supabase.from("productos").select("id, stock").eq("nombre", nombreProducto).single();
          if (prod) await supabase.from("productos").update({ stock: Math.max(0, prod.stock - cantidadRestar) }).eq("id", prod.id);
        }
      }
    }
    await supabase.from("pedidos").update({ aprobado: true, estado_entrega: 'entregado' }).eq("id", pedido.id);
    mostrarToast(pedido.es_dropshipping ? "Dropshipping Confirmado" : "Entrega cerrada y stock descontado");
    cargarTodo();
  };

  const toggleAcordeonCategoria = (nombreCat: string) => {
    if (categoriaAbierta === nombreCat) {
      setCategoriaAbierta(null);
    } else {
      setCategoriaAbierta(nombreCat);
    }
  };

  const pedidosFiltrados = pedidos.filter(p => filtroMes === "Todos" ? true : p.creado_en && p.creado_en.startsWith(filtroMes));
  const pedidosActivos = pedidosFiltrados.filter(p => !(p.aprobado && p.estado_pago === 'pagado' && p.estado_entrega === 'entregado'));
  const productosFiltrados = productos.filter(p => busquedaCatalogo.trim() === "" ? true : p.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()) || p.categoria.toLowerCase().includes(busquedaCatalogo.toLowerCase()));

  const productosFiltradosParaVentaManual = productos.filter(p => {
    if (categoriaFiltroVenta === "Oferta Relampago") {
      return p.precio_oferta !== null && p.oferta_hasta !== null;
    }
    return categoriaFiltroVenta === "" ? true : p.categoria === categoriaFiltroVenta;
  });

  const productosEnOfertaRelampago = productos.filter(p => p.precio_oferta !== null && p.oferta_hasta !== null);

  if (!logueado) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 16 }}>
      <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 30, width: "100%", maxWidth: 320, textAlign: "center" }}>
        <h2 style={{ ...neon, fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Panel Admin</h2>
        <input type="password" placeholder="Clave secreta" value={clave} onChange={e => setClave(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} style={{ ...inputStyle, marginBottom: 12, border: "1px solid #ff2d78", textAlign: "center" }} />
        {error && <div style={{ color: "#ff2d78", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button onClick={login} style={buttonStyle}>Entrar</button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "sans-serif", color: "#fff", padding: "12px 12px 60px 12px", boxSizing: "border-box" }}>

      {toast !== "" && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#ff2d78", color: "#fff", padding: "10px 20px", borderRadius: 10, fontWeight: 700, zIndex: 9999, fontSize: 13 }}>
          {toast}
        </div>
      )}

      {/* CARTEL DE ADVERTENCIA PARA CONFIRMAR ELIMINACIÓN */}
      {confirmarEliminar && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={() => setConfirmarEliminar(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} />
          <div style={{ position: "relative", background: "#111", border: "2px solid #EF4444", borderRadius: 20, padding: 28, width: "100%", maxWidth: 340, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ color: "#EF4444", fontWeight: 900, fontSize: 18, marginBottom: 10 }}>¿Eliminar producto definitivamente?</h3>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{confirmarEliminar.nombre}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => eliminarProducto(confirmarEliminar.id)} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #EF4444, #B91C1C)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13 }}>Sí, borrar del catálogo</button>
              <button onClick={() => setConfirmarEliminar(null)} style={{ width: "100%", padding: 12, background: "#222", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "8px 4px", borderBottom: "1px solid #222", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ ...neon, fontSize: 19, fontWeight: 900, margin: 0 }}>CARITO.SHOP - Admin</h1>
          <span style={{ color: "#555", fontSize: 11 }}>Panel de Control</span>
        </div>
        <a href="/" style={{ color: "#ff2d78", fontSize: 12, textDecoration: "none" }}>Ver tienda</a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button onClick={() => setPestana('catalogo')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === 'catalogo' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>📦 Catalogo</button>
          <button onClick={() => setPestana('alta')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === 'alta' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>✨ Nuevo Producto</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <button onClick={() => setPestana('cargar_venta')} style={{ padding: 12, borderRadius: 10, border: "1px dashed #ff2d78", fontWeight: 800, fontSize: 11, background: pestana === 'cargar_venta' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>📝 Cargar Venta</button>
          <button onClick={() => setPestana('ventas')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11, background: pestana === 'ventas' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>{"📈 Ordenes (" + pedidosActivos.length + ")"}</button>
          <button onClick={() => setPestana('caja')} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11, background: pestana === 'caja' ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>💰 Caja</button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {pestana === 'cargar_venta' && (
          <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px dashed #ff2d78" }}>
            <h2 style={{ fontSize: 16, margin: "0 0 16px 0", ...neon }}>Registrar Venta Manual</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Nombre del Cliente</div>
                <input value={ventaManual.cliente} onChange={e => setVentaManual(p => ({ ...p, cliente: e.target.value }))} placeholder="Nombre y Apellido" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Telefono</div>
                  <input value={ventaManual.telefono} onChange={e => setVentaManual(p => ({ ...p, telephone: e.target.value, telefono: e.target.value }))} placeholder="Celular" style={inputStyle} />
                </div>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Direccion</div>
                  <input value={ventaManual.direccion} onChange={e => setVentaManual(p => ({ ...p, direccion: e.target.value }))} placeholder="Calle y Nro" style={inputStyle} />
                </div>
              </div>

              <div>
                <div style={{ color: "#ff2d78", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>1. Filtrar por Categoría</div>
                <select 
                  value={categoriaFiltroVenta} 
                  onChange={e => {
                    setCategoriaFiltroVenta(e.target.value);
                    setVentaManual(p => ({ ...p, productoId: "" })); 
                  }} 
                  style={{ ...inputStyle, border: "1px solid #ff2d78" }}
                >
                  <option value="">-- Ver Todas las Categorías --</option>
                  {productosEnOfertaRelampago.length > 0 && (
                    <option value="Oferta Relampago">⚡ Oferta Relámpago Activas</option>
                  )}
                  {listadoCategorias.map(cat => (
                    <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>2. Seleccionar Producto</div>
                <select value={ventaManual.productoId} onChange={e => setVentaManual(p => ({ ...p, productoId: e.target.value }))} style={inputStyle}>
                  <option value="">-- Elegí un producto --</option>
                  {productosFiltradosParaVentaManual.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre + " ($" + (p.precio_oferta || p.precio).toLocaleString("es-AR") + " - Stock: " + p.stock + ")"}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0a0a0a", padding: 12, borderRadius: 10, border: "1px solid #222" }}>
                <input type="checkbox" id="drop" checked={ventaManual.esDropshipping} onChange={e => setVentaManual(p => ({ ...p, esDropshipping: e.target.checked }))} style={{ transform: "scale(1.3)" }} />
                <label htmlFor="drop" style={{ fontSize: 13, color: "#ccc" }}>Es Dropshipping (sin descontar stock propio)</label>
              </div>
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Forma de Pago / Modalidad</div>
                <select value={ventaManual.tipoPago} onChange={e => setVentaManual(p => ({ ...p, tipoPago: e.target.value }))} style={inputStyle}>
                  <option value="Efectivo">Efectivo Líquido</option>
                  <option value="Alias: carito.shop">Transferencia: Alias carito.shop</option>
                  <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">Transferencia: Brubank Señora</option>
                  <option value="Cuotas">Financiar en 3 Cuotas (Calculador Oscar)</option>
                </select>
              </div>

              {ventaManual.tipoPago !== "Cuotas" && (
                <div>
                  <div style={{ color: "#ff2d78", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Monto Entregado / Seña Recibida ($)</div>
                  <input value={ventaManual.montoEntregado} onChange={e => setVentaManual(p => ({ ...p, montoEntregado: e.target.value }))} placeholder="Dejar vacío si pagó el total" type="number" style={{ ...inputStyle, border: "1px solid #ff2d78" }} />
                </div>
              )}

              <button type="button" onClick={ventaManual.productoId === "" ? () => mostrarToast("Por favor elegí un producto") : ejecutarCargaVentaManual} style={buttonStyle}>Registrar Venta</button>
            </div>
          </div>
        )}

        {pestana === 'catalogo' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="text" value={busquedaCatalogo} onChange={e => setBusquedaCatalogo(e.target.value)} placeholder="Buscar producto por nombre..." style={inputStyle} />
            
            {busquedaCatalogo.trim() === "" ? (
              <>
                {productosEnOfertaRelampago.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", background: "#111", borderRadius: 14, overflow: "hidden", border: "2px dashed #ff2d78" }}>
                    <button 
                      type="button" 
                      onClick={() => toggleAcordeonCategoria("Oferta Relampago")}
                      style={{ width: "100%", padding: "16px 14px", background: "linear-gradient(90deg, #2b0c16, #111)", border: "none", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", outline: "none", textAlign: "left" }}
                    >
                      <span style={{ fontWeight: 900, fontSize: 14, color: "#ff2d78" }}>
                        ⚡ Oferta Relámpago Activas <span style={{ color: "#aaa", fontSize: 11 }}>({productosEnOfertaRelampago.length})</span>
                      </span>
                      <span style={{ fontSize: 12, color: "#ff2d78", fontWeight: "bold" }}>
                        {categoriaAbierta === "Oferta Relampago" ? "▲ CERRAR" : "▼ EXPANDIR"}
                      </span>
                    </button>

                    {categoriaAbierta === "Oferta Relampago" && (
                      <div style={{ padding: 10, background: "#0a0a0a", display: "flex", flexDirection: "column", gap: 10 }}>
                        {productosEnOfertaRelampago.map((p) => (
                          <div key={p.id} style={{ background: "#111", borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "center", border: "1px solid #ff2d78" }}>
                            <div style={{ width: 45, height: 45, borderRadius: 8, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "1px dashed #ff2d78" }}>
                              {p.imagen ? <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>{p.emoji}</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                              <div style={{ fontSize: 12, color: "#ff2d78", fontWeight: 800 }}>
                                <span style={{ textDecoration: "line-through", color: "#555", marginRight: 6, fontSize: 11 }}>${p.precio}</span>
                                ${p.precio_oferta}
                              </div>
                              <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginTop: 2 }}>
                                ⏳ {calcularTiempoRestanteString(p.oferta_hasta)}
                              </div>
                            </div>
                            <button type="button" onClick={() => ejecutarRemoverOfertaManual(p.id)} style={{ padding: "6px 10px", background: "#333", color: "#ff2d78", border: "1px solid #ff2d78", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Apagar</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {listadoCategorias.map((cat) => {
                  const productosDeEstaCat = productos.filter(p => p.categoria === cat.Nombre);
                  const estaAbierta = categoriaAbierta === cat.Nombre;

                  return (
                    <div key={cat.id} style={{ display: "flex", flexDirection: "column", background: "#111", borderRadius: 14, overflow: "hidden", border: "1px solid #222" }}>
                      <button 
                        type="button" 
                        onClick={() => toggleAcordeonCategoria(cat.Nombre)}
                        style={{ width: "100%", padding: "16px 14px", background: estaAbierta ? "#1c0510" : "#111", border: "none", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", outline: "none", textAlign: "left" }}
                      >
                        <span style={{ fontWeight: 800, fontSize: 14, color: estaAbierta ? "#ff2d78" : "#fff" }}>
                          📁 {cat.Nombre} <span style={{ color: "#555", fontSize: 12, fontWeight: 400 }}>({productosDeEstaCat.length})</span>
                        </span>
                        <span style={{ fontSize: 12, color: "#ff2d78", fontWeight: "bold" }}>
                          {estaAbierta ? "▲ CERRAR" : "▼ EXPANDIR"}
                        </span>
                      </button>

                      {estaAbierta && (
                        <div style={{ padding: 10, background: "#0a0a0a", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #222" }}>
                          {productosDeEstaCat.map((p: Producto) => (
                            <div key={p.id} style={{ background: "#111", borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "center", border: "1px solid #222", opacity: p.activo ? 1 : 0.4 }}>
                              <div style={{ width: 45, height: 45, borderRadius: 8, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "1px dashed #ff2d78" }}>
                                {p.imagen ? <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>{p.emoji}</span>}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre} {!p.activo && <span style={{fontSize:10, color:'#EF4444'}}>(Oculto)</span>}</div>
                                <div style={{ fontSize: 12, color: "#ff2d78", fontWeight: 800 }}>
                                  {p.precio_oferta ? (
                                    <>
                                      <span style={{ textDecoration: "line-through", color: "#555", marginRight: 6, fontSize: 11 }}>${p.precio}</span>
                                      <span>${p.precio_oferta} ⚡</span>
                                    </>
                                  ) : `$${p.precio}`}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                                  <button type="button" onClick={() => actualizarStock(p.id, p.stock, -1)} style={{ background: "#222", border: "1px solid #333", color: "#fff", width: 24, height: 24, borderRadius: 4, cursor: "pointer" }}>-</button>
                                  <span style={{ fontSize: 12, color: "#aaa" }}>{"Stock: " + p.stock}</span>
                                  <button type="button" onClick={() => actualizarStock(p.id, p.stock, 1)} style={{ background: "#222", border: "1px solid #333", color: "#fff", width: 24, height: 24, borderRadius: 4, cursor: "pointer" }}>+</button>
                                </div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                                <button type="button" onClick={() => setEditando(p)} style={{ padding: "8px 12px", background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Editar</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {productosFiltrados.map((p: Producto) => (
                  <div key={p.id} style={{ background: "#111", borderRadius: 14, padding: 12, display: "flex", gap: 12, alignItems: "center", border: "1px solid #222" }}>
                    <div style={{ width: 45, height: 45, borderRadius: 8, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "1px dashed #ff2d78" }}>
                      {p.imagen ? <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>{p.emoji}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold" }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: "#ff2d78", fontWeight: 800 }}>${p.precio}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestana === 'alta' && (
          <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #ff2d78" }}>
            <h2 style={{ ...neon, fontSize: 16, margin: "0 0 16px 0" }}>Nuevo Producto</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={nuevo.nombre} onChange={e => handleCambioNombreAlta(e.target.value)} placeholder="Nombre del producto" style={inputStyle} />
              <input value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} placeholder="Precio" type="number" style={inputStyle} />
              <select value={nuevo.categoria} onChange={e => handleSeleccionarCategoria(e.target.value)} style={inputStyle}>
                {listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}
                <option value="NUEVA">+ Crear nueva categoria</option>
              </select>
              {creandoNuevaCat && (
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={nuevaCatNombre} onChange={e => setNuevaCatNombre(e.target.value)} placeholder="Nombre categoria" style={inputStyle} />
                  <button type="button" onClick={ejecutarCrearCategoria} style={{ background: "#10B981", border: "none", color: "#fff", padding: 10, borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Ok</button>
                </div>
              )}
              <input value={nuevo.stock} onChange={e => setNuevo(p => ({ ...p, stock: e.target.value }))} placeholder="Stock inicial" type="number" style={inputStyle} />
              <button type="button" onClick={agregar} style={buttonStyle}>Publicar Producto</button>
            </div>
          </div>
        )}

        {pestana === 'ventas' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Ordenes Activas</h2>
              <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: 6, borderRadius: 8, fontSize: 12 }}>
                <option value="Todos">Todos</option>
                {mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {pedidosActivos.map((p: Pedido) => {
              return (
                <div key={p.id} style={{ background: "#111", borderRadius: 14, padding: 14, border: p.aprobado ? "1px solid #222" : "2px solid #ff2d78" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14 }}>{p.cliente_nombre} {p.es_dropshipping && <span style={{ fontSize: 10, background: "#7C3AED", padding: "1px 6px", borderRadius: 4, marginLeft: 6 }}>Drop</span>}</h4>
                      <select value={p.cuenta_ingreso} onChange={e => cambiarCuentaIngreso(p.id, e.target.value)} style={{ background: "#000", color: "#ff2d78", fontSize: 12, padding: 5, marginTop: 6, borderRadius: 6, border: "1px solid #ff2d78", fontWeight: 700 }}>
                        <option value="Efectivo">💵 Efectivo Líquido</option>
                        <option value="Alias: carito.shop">📱 Alias carito.shop</option>
                        <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">👩 Brubank Señora</option>
                      </select>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{"$" + p.total.toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, background: "#000", padding: 8, borderRadius: 6, margin: "8px 0" }}>{p.productos}</p>
                  <div style={{ display: "flex", gap: 6, borderTop: "1px solid #222", paddingTop: 8 }}>
                    {!p.aprobado && <button type="button" onClick={() => ejecutarConfirmacionEntregaReal(p)} style={{ background: "linear-gradient(135deg, #ff2d78, #ff0055)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 800 }}>Confirmar Entrega</button>}
                    <select value={p.estado_pago} onChange={e => cambiarEstadoPago(p.id, e.target.value)} style={{ background: "#222", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, padding: 5 }}><option value="pendiente_pago">Debe</option><option value="pagado">Pago Total</option></select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pestana === 'caja' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 16, padding: 14 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 12px 0", color: "#ff2d78" }}>Saldos Disponibles</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Efectivo:</span><strong>{"$" + cajas.efectivo.toLocaleString("es-AR")}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Alias carito.shop:</span><strong>{"$" + cajas.alias.toLocaleString("es-AR")}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Brubank Señora:</span><strong>{"$" + cajas.brubankSenora.toLocaleString("es-AR")}</strong></div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL UNIFICADO: Abre al tocar "Editar". Con Scroll Móvil asegurado y todos los botones juntos */}
      {editando && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <div onClick={() => setEditando(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} />
          <div style={{ position: "relative", background: "#111", border: "2px solid #ff2d78", borderRadius: 20, padding: 20, width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ ...neon, margin: 0, fontSize: 16, fontWeight: 900 }}>⚙️ MODIFICAR PRODUCTO</h3>
              <button type="button" onClick={() => setEditando(null)} style={{ background: "#222", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", fontWeight: "bold", cursor: "pointer" }}>X</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              <div>
                <span style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 4 }}>Nombre del Producto</span>
                <input value={editando.nombre} onChange={e => setEditando(p => p ? { ...p, nombre: e.target.value } : null)} placeholder="Nombre" style={inputStyle} />
              </div>
              
              <div>
                <span style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 4 }}>Precio Lista Base ($)</span>
                <input type="number" value={editando.precio} onChange={e => setEditando(p => p ? { ...p, precio: parseInt(e.target.value) } : null)} placeholder="Precio" style={inputStyle} />
              </div>

              {/* Módulo Oferta Relámpago */}
              <div style={{ background: "#0a0a0a", padding: 12, borderRadius: 12, border: "1px dashed #ff2d78" }}>
                <span style={{ color: "#ff2d78", fontSize: 12, fontWeight: 800, display: "block", marginBottom: 6 }}>⚡ Oferta Relámpago</span>
                
                {editando.precio_oferta ? (
                  <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>¡Oferta Activa a ${editando.precio_oferta}!</div>
                    <div style={{ fontSize: 11, color: "#aaa", margin: "4px 0 8px 0" }}>⏳ Quedan: {calcularTiempoRestanteString(editando.oferta_hasta)}</div>
                    <button type="button" onClick={() => ejecutarRemoverOfertaManual(editando.id)} style={{ width: "100%", padding: 8, borderRadius: 8, background: "#222", border: "1px solid #EF4444", color: "#EF4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Apagar Oferta</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <input 
                        type="number" 
                        placeholder="Precio ($)" 
                        value={precioOfertaManual} 
                        onChange={e => setPrecioOfertaManual(e.target.value)} 
                        style={{ ...inputStyle, padding: 8, fontSize: 12 }} 
                      />
                      <select 
                        value={horasOfertaManual} 
                        onChange={e => setHorasOfertaManual(e.target.value)} 
                        style={{ ...inputStyle, padding: 8, fontSize: 12 }}
                      >
                        <option value="1">1 Hora</option>
                        <option value="3">3 Horas</option>
                        <option value="6">6 Horas</option>
                        <option value="12">12 Horas</option>
                        <option value="24">24 Horas</option>
                        <option value="48">48 Horas</option>
                      </select>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => lanzarOfertaRelampagoGlobal(editando.id)} 
                      style={{ width: "100%", padding: 8, background: "#ff2d78", border: "none", color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Activar Oferta Relámpago
                    </button>
                  </div>
                )}
              </div>

              {/* SECCIÓN INTERRUPTORES DE ESTADO CORREGIDOS (VISIBLES SÍ O SÍ) */}
              <div style={{ background: "#161616", padding: 12, borderRadius: 12, border: "1px solid #222", display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ color: "#aaa", fontSize: 11, fontWeight: 700 }}>👁️ VISIBILIDAD Y CONTROL</span>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button 
                    type="button" 
                    onClick={() => toggleActivo(editando.id, editando.activo)} 
                    style={{ padding: 10, background: editando.activo ? "#374151" : "#10B981", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {editando.activo ? "⏸️ Ocultar Tienda" : "▶️ Mostrar Tienda"}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setConfirmarEliminar(editando)} 
                    style={{ padding: 10, background: "#7F1D1D", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    🗑️ Eliminar Producto
                  </button>
                </div>
              </div>

              {/* BOTONES DE GUARDADO GENERAL */}
              <div style={{ display: "flex", gap: 10, borderTop: "1px solid #222", paddingTop: 12, marginTop: 4 }}>
                <button type="button" onClick={() => setEditando(null)} style={{ ...buttonStyle, padding: 12, background: "#222", fontWeight: 700 }}>Cerrar panel</button>
                <button type="button" onClick={guardarEdicion} style={{ ...buttonStyle, padding: 12 }}>Guardar Cambios</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}