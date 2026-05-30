"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

type Producto = {
  id: number; nombre: string; descripcion: string; precio: number;
  precio_oferta: number | null; oferta_hasta: string | null; emoji: string;
  activo: boolean; imagen: string; imagen2: string; imagen3: string;
  categoria: string; stock: number;
};
type Categoria = { id: number; Nombre: string; };
type Pedido = {
  id: number; cliente_nombre: string; cliente_telefono: string;
  cliente_direccion: string; productos: string; total: number;
  estado_pago: string; estado_entrega: string; aprobado: boolean;
  creado_en: string; cuenta_ingreso: string; es_dropshipping?: boolean;
  anticipo?: number; es_financiado?: boolean; cuotas_totales?: number;
  cuotas_pagadas?: number; monto_cuota?: number;
};
type Gasto = {
  id: number; distribuidora: string; monto: number; concepto: string;
  cuenta_salida: string; creado_en: string; comprobante_url?: string;
  tipo_movimiento?: string;
};
type ElementoHistorial = {
  fecha: string; entidad: string; concepto: string; monto: number;
  cuenta: string; esIngreso: boolean; comprobanteUrl?: string;
};
type PagoParcial = {
  id: number; pedido_id: number; cliente_nombre: string;
  monto: number; comprobante_url?: string; cuenta: string; creado_en: string;
};
type ItemCarrito = {
  productoId: number; nombre: string; precio: number; cantidad: number;
};

const CLAVE = "carito2026";
const neon = { color: "#ff2d78", textShadow: "0 0 10px #ff2d78" };
const inputStyle = {
  width: "100%", padding: 12, borderRadius: 12, border: "1px solid #222",
  background: "#111", color: "#fff", fontSize: 14,
  boxSizing: "border-box" as const, outline: "none",
};
const buttonStyle = {
  width: "100%", padding: 14,
  background: "linear-gradient(135deg, #ff2d78, #ff0055)",
  border: "none", borderRadius: 12, color: "#fff",
  fontWeight: 800, fontSize: 14, cursor: "pointer",
} as const;

const normalizarCuenta = (str: string): string => {
  if (!str) return "";
  const s = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[💵📱👩]/g, "").replace("caja:", "").replace("transferencia:", "").trim();
  if (s.includes("alias") || s.includes("carito")) return "alias";
  if (s.includes("brubank") || s.includes("senora") || s.includes("diario")) return "brubank";
  if (s.includes("efectivo")) return "efectivo";
  return s;
};

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function AdminMobileCompleto() {
  const [logueado, setLogueado] = useState(false);
  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [pestana, setPestana] = useState<"catalogo" | "alta" | "ventas" | "caja" | "cargar_venta">("catalogo");

  const [cajas, setCajas] = useState({ alias: 0, brubankSenora: 0, efectivo: 0 });
  const [productos, setProductos] = useState<Producto[]>([]);
  const [listadoCategorias, setListadoCategorias] = useState<Categoria[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [historialUnificado, setHistorialUnificado] = useState<ElementoHistorial[]>([]);

  const [toast, setToast] = useState("");
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<Producto | null>(null);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState("");
  const [categoriaAbierta, setCategoriaAbierta] = useState<string | null>(null);
  const [filtroMes, setFiltroMes] = useState("Todos");
  const [mesesDisponibles, setMesesDisponibles] = useState<string[]>([]);

  const [nuevo, setNuevo] = useState({
    nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "",
    emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: "", stock: "0",
  });
  const [creandoNuevaCat, setCreandoNuevaCat] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [coincidenciasAlta, setCoincidenciasAlta] = useState<Producto[]>([]);

  const [ventaCliente, setVentaCliente] = useState({ nombre: "", telefono: "", direccion: "" });
  const [sugerenciasCliente, setSugerenciasCliente] = useState<{nombre: string; telefono: string; direccion: string}[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [carritoVenta, setCarritoVenta] = useState<ItemCarrito[]>([]);
  const [categoriaFiltroVenta, setCategoriaFiltroVenta] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState("1");
  const [tipoPagoVenta, setTipoPagoVenta] = useState("Efectivo");
  const [montoEntregadoVenta, setMontoEntregadoVenta] = useState("");
  const [esDropshippingVenta, setEsDropshippingVenta] = useState(false);

  const [tipoMovimiento, setTipoMovimiento] = useState<"ingreso" | "egreso">("egreso");
  const [movimientoManual, setMovimientoManual] = useState({
    entidad: "", monto: "", concepto: "", cuenta: "alias", comprobanteUrl: "",
  });
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);

  const [filtroHistorialCuenta, setFiltroHistorialCuenta] = useState("todas");
  const [filtroHistorialTipo, setFiltroHistorialTipo] = useState("todos");
  const [editandoDeudaId, setEditandoDeudaId] = useState<number | null>(null);
  const [nuevoSaldoDeuda, setNuevoSaldoDeuda] = useState("");
  const [vistaProductoCompleto, setVistaProductoCompleto] = useState<Producto | null>(null);
  const [editandoClienteId, setEditandoClienteId] = useState<number | null>(null);
  const [editandoClienteData, setEditandoClienteData] = useState({ nombre: "", telefono: "", direccion: "" });

  const [pagoParcialModal, setPagoParcialModal] = useState<Pedido | null>(null);
  const [montoPagoParcial, setMontoPagoParcial] = useState("");
  const [cuentaPagoParcial, setCuentaPagoParcial] = useState("Efectivo");
  const [comprobantePagoParcial, setComprobantePagoParcial] = useState("");
  const [subiendoComprobantePago, setSubiendoComprobantePago] = useState(false);

  useEffect(() => { if (logueado) cargarTodo(); }, [logueado]);

  const cargarTodo = async () => {
    setCargando(true);
    const { data: prodData } = await supabase.from("productos").select("*").order("id", { ascending: false });
    const { data: catData } = await supabase.from("categorias").select("*").order("Nombre", { ascending: true });
    const { data: pData } = await supabase.from("pedidos").select("*").order("creado_en", { ascending: false });
    const { data: gData } = await supabase.from("gastos_distribuidoras").select("*").order("creado_en", { ascending: false });
    const { data: ppData } = await supabase.from("pagos_parciales").select("*").order("creado_en", { ascending: false });

    if (prodData) {
      setProductos(prodData);
      if (vistaProductoCompleto) {
        const actualizado = prodData.find((p: Producto) => p.id === vistaProductoCompleto.id);
        if (actualizado) setVistaProductoCompleto(actualizado);
      }
    }
    if (catData) {
      setListadoCategorias(catData);
      if (catData.length > 0 && !nuevo.categoria)
        setNuevo(prev => ({ ...prev, categoria: catData[0].Nombre }));
    }

    const listaPedidos: Pedido[] = pData || [];
    setPedidos(listaPedidos);
    const meses = Array.from(new Set(listaPedidos.map(p => p.creado_en?.substring(0, 7) || ""))).filter(Boolean) as string[];
    setMesesDisponibles(meses);

    const listaGastos: Gasto[] = gData || [];
    setGastos(listaGastos);
    const listaPagosParciales: PagoParcial[] = ppData || [];

    let totalAlias = 0, totalBrubank = 0, totalEfectivo = 0;
    const pool: ElementoHistorial[] = [];

    listaPedidos.forEach(p => {
      const tienePagosParciales = listaPagosParciales.some(pp => pp.pedido_id === p.id);
      const montoEfectivo = tienePagosParciales
        ? (p.estado_pago === "pagado" && (p.anticipo || 0) === p.total ? p.total - listaPagosParciales.filter(pp => pp.pedido_id === p.id).reduce((a, x) => a + x.monto, 0) : 0)
        : (p.estado_pago === "pagado" ? p.total : (p.anticipo || 0));
      const tag = normalizarCuenta(p.cuenta_ingreso);
      if (montoEfectivo > 0) {
        if (tag === "alias") totalAlias += montoEfectivo;
        else if (tag === "brubank") totalBrubank += montoEfectivo;
        else if (tag === "efectivo") totalEfectivo += montoEfectivo;
        pool.push({
          fecha: p.creado_en, entidad: p.cliente_nombre, concepto: p.productos,
          monto: montoEfectivo,
          cuenta: tag === "alias" ? "📱 Alias" : tag === "brubank" ? "👩 Brubank" : "💵 Efectivo",
          esIngreso: true,
        });
      }
    });

    listaPagosParciales.forEach(pp => {
      const tag = normalizarCuenta(pp.cuenta);
      if (tag === "alias") totalAlias += pp.monto;
      else if (tag === "brubank") totalBrubank += pp.monto;
      else if (tag === "efectivo") totalEfectivo += pp.monto;
      pool.push({
        fecha: pp.creado_en, entidad: pp.cliente_nombre, concepto: "Pago parcial",
        monto: pp.monto,
        cuenta: tag === "alias" ? "📱 Alias" : tag === "brubank" ? "👩 Brubank" : "💵 Efectivo",
        esIngreso: true, comprobanteUrl: pp.comprobante_url,
      });
    });

    listaGastos.forEach(g => {
      const esIngresoManual = g.tipo_movimiento === "ingreso";
      const monto = g.monto || 0;
      const tag = normalizarCuenta(g.cuenta_salida);
      if (tag === "alias") { esIngresoManual ? (totalAlias += monto) : (totalAlias -= monto); }
      else if (tag === "brubank") { esIngresoManual ? (totalBrubank += monto) : (totalBrubank -= monto); }
      else if (tag === "efectivo") { esIngresoManual ? (totalEfectivo += monto) : (totalEfectivo -= monto); }
      const concepto = (g.concepto || "").replace("[INGRESO MANUAL] - ", "");
      const cuentaNombre = tag === "alias" ? "📱 Alias" : tag === "brubank" ? "👩 Brubank" : "💵 Efectivo";
      pool.push({ fecha: g.creado_en, entidad: g.distribuidora, concepto, monto, cuenta: cuentaNombre, esIngreso: esIngresoManual, comprobanteUrl: g.comprobante_url });
    });

    pool.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    setHistorialUnificado(pool);
    setCajas({ alias: totalAlias, brubankSenora: totalBrubank, efectivo: totalEfectivo });
    setCargando(false);
  };

  const mostrarToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const login = () => { if (clave === CLAVE) setLogueado(true); else setErrorLogin("Clave incorrecta"); };

  const toggleActivo = async (id: number, activo: boolean) => {
    await supabase.from("productos").update({ activo: !activo }).eq("id", id); cargarTodo();
  };
  const actualizarStock = async (id: number, stockActual: number, cambio: number) => {
    await supabase.from("productos").update({ stock: Math.max(0, stockActual + cambio) }).eq("id", id); cargarTodo();
  };
  const eliminarProducto = async (id: number) => {
    await supabase.from("productos").delete().eq("id", id);
    setConfirmarEliminar(null); setVistaProductoCompleto(null);
    mostrarToast("Producto eliminado"); cargarTodo();
  };
  const guardarEdicion = async () => {
    if (!editando) return;
    await supabase.from("productos").update({
      nombre: editando.nombre, descripcion: editando.descripcion, precio: editando.precio,
      precio_oferta: editando.precio_oferta, emoji: editando.emoji, imagen: editando.imagen,
      imagen2: editando.imagen2, imagen3: editando.imagen3,
      categoria: editando.categoria, stock: editando.stock,
    }).eq("id", editando.id);
    setEditando(null); mostrarToast("Producto actualizado"); cargarTodo();
  };

  const subirFoto = async (file: File, campo: string) => {
    setSubiendo(true);
    const nombre = Date.now() + "-" + file.name;
    await supabase.storage.from("productos").upload(nombre, file);
    const { data } = supabase.storage.from("productos").getPublicUrl(nombre);
    if (editando) setEditando(prev => prev ? { ...prev, [campo]: data.publicUrl } : null);
    else setNuevo(prev => ({ ...prev, [campo]: data.publicUrl }));
    setSubiendo(false); mostrarToast("Foto subida");
  };

  const agregar = async () => {
    if (!nuevo.nombre || !nuevo.precio) { mostrarToast("Completá nombre y precio"); return; }
    await supabase.from("productos").insert({
      nombre: nuevo.nombre, descripcion: nuevo.descripcion, precio: parseInt(nuevo.precio),
      precio_oferta: nuevo.precio_oferta ? parseInt(nuevo.precio_oferta) : null,
      emoji: nuevo.emoji, imagen: nuevo.imagen, imagen2: nuevo.imagen2, imagen3: nuevo.imagen3,
      categoria: nuevo.categoria, stock: parseInt(nuevo.stock) || 0, activo: true,
    });
    mostrarToast("Producto publicado");
    setNuevo({ nombre: "", descripcion: "", precio: "", precio_oferta: "", oferta_hasta: "", emoji: "🛍️", imagen: "", imagen2: "", imagen3: "", categoria: listadoCategorias[0]?.Nombre || "", stock: "0" });
    setCoincidenciasAlta([]); setPestana("catalogo"); cargarTodo();
  };

  const ejecutarCrearCategoria = async () => {
    if (!nuevaCatNombre.trim()) return;
    const { error: catErr } = await supabase.from("categorias").insert({ Nombre: nuevaCatNombre.trim() });
    if (catErr) { mostrarToast("Ya existe esa categoría"); return; }
    mostrarToast("Categoría agregada");
    setNuevo(prev => ({ ...prev, categoria: nuevaCatNombre.trim() }));
    setNuevaCatNombre(""); setCreandoNuevaCat(false); cargarTodo();
  };

  const agregarAlCarritoVenta = () => {
    if (!productoSeleccionado) { mostrarToast("Elegí un producto"); return; }
    const prod = productos.find(p => p.id === parseInt(productoSeleccionado));
    if (!prod) return;
    const cantidad = parseInt(cantidadSeleccionada) || 1;
    const precio = prod.precio_oferta || prod.precio;
    const existe = carritoVenta.find(i => i.productoId === prod.id);
    if (existe) {
      setCarritoVenta(prev => prev.map(i => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + cantidad } : i));
    } else {
      setCarritoVenta(prev => [...prev, { productoId: prod.id, nombre: prod.nombre, precio, cantidad }]);
    }
    setProductoSeleccionado(""); setCantidadSeleccionada("1");
    mostrarToast("Producto agregado al pedido");
  };

  const quitarDelCarritoVenta = (productoId: number) => {
    setCarritoVenta(prev => prev.filter(i => i.productoId !== productoId));
  };

  const totalCarritoVenta = carritoVenta.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const ejecutarCargaVentaManual = async () => {
    if (!ventaCliente.nombre) { mostrarToast("Ingresá el nombre del cliente"); return; }
    if (carritoVenta.length === 0) { mostrarToast("Agregá al menos un producto"); return; }
    const productosTexto = carritoVenta.map(i => i.nombre + " x" + i.cantidad).join(", ");
    const total = totalCarritoVenta;
    let anticipo = 0, estadoPago = "pendiente_pago", esFinanciado = false;
    let cuotasTotales = 1, cuotasPagadas = 1, montoCuota = 0;
    const cuentaAsignada = tipoPagoVenta === "Cuotas" ? "Efectivo" : tipoPagoVenta;
    if (tipoPagoVenta === "Cuotas") {
      esFinanciado = true; cuotasTotales = 3; cuotasPagadas = 1;
      const c1 = total / 3;
      anticipo = Math.ceil(c1 / 1000) * 1000;
      montoCuota = Math.ceil((c1 * 1.10) / 1000) * 1000;
    } else {
      if (montoEntregadoVenta === "" || montoEntregadoVenta === "0") {
        anticipo = 0;
      } else {
        const entregado = parseInt(montoEntregadoVenta);
        if (!isNaN(entregado)) {
          anticipo = entregado;
          if (entregado >= total) { anticipo = total; estadoPago = "pagado"; }
        }
      }
    }
    await supabase.from("pedidos").insert({
      cliente_nombre: ventaCliente.nombre, cliente_telefono: ventaCliente.telefono,
      cliente_direccion: ventaCliente.direccion, productos: productosTexto,
      total, estado_pago: estadoPago, estado_entrega: "pendiente_entrega",
      aprobado: false, es_financiado: esFinanciado, cuotas_totales: cuotasTotales,
      cuotas_pagadas: cuotasPagadas, monto_cuota: montoCuota, anticipo,
      cuenta_ingreso: cuentaAsignada, es_dropshipping: esDropshippingVenta,
    });
    mostrarToast("Venta registrada");
    setVentaCliente({ nombre: "", telefono: "", direccion: "" });
    setCarritoVenta([]); setTipoPagoVenta("Efectivo"); setMontoEntregadoVenta("");
    setEsDropshippingVenta(false); setCategoriaFiltroVenta(""); setPestana("ventas");
    cargarTodo();
  };

  const cambiarEstadoPago = async (id: number, nuevoEstado: string) => {
    const updates: Record<string, unknown> = { estado_pago: nuevoEstado };
    if (nuevoEstado === "pagado") { const p = pedidos.find(o => o.id === id); if (p) updates.anticipo = p.total; }
    await supabase.from("pedidos").update(updates).eq("id", id); cargarTodo();
  };
  const cambiarEstadoEntrega = async (id: number, nuevoEstado: string) => {
    await supabase.from("pedidos").update({ estado_entrega: nuevoEstado }).eq("id", id); cargarTodo();
  };
  const cambiarCuentaIngreso = async (id: number, nuevaCuenta: string) => {
    await supabase.from("pedidos").update({ cuenta_ingreso: nuevaCuenta }).eq("id", id); cargarTodo();
  };
  const ejecutarConfirmacionEntregaReal = async (pedido: Pedido) => {
    if (pedido.aprobado) return;
    if (!pedido.es_dropshipping) {
      const items = pedido.productos.split(", ");
      for (const item of items) {
        const partes = item.split(" x");
        if (partes.length === 2) {
          const nombreProducto = partes[0].trim();
          const cant = parseInt(partes[1]);
          const { data: prod } = await supabase.from("productos").select("id, stock").eq("nombre", nombreProducto).single();
          if (prod) await supabase.from("productos").update({ stock: Math.max(0, prod.stock - cant) }).eq("id", prod.id);
        }
      }
    }
    await supabase.from("pedidos").update({ aprobado: true, estado_entrega: "entregado" }).eq("id", pedido.id);
    mostrarToast(pedido.es_dropshipping ? "Dropshipping Confirmado" : "Entrega cerrada y stock descontado");
    cargarTodo();
  };
  const guardarModificacionDeudaManual = async (id: number, totalPedido: number) => {
    const deudaFijada = parseInt(nuevoSaldoDeuda);
    if (isNaN(deudaFijada) || deudaFijada < 0 || deudaFijada > totalPedido) { mostrarToast("Monto inválido"); return; }
    const nuevoAnticipoCalculado = totalPedido - deudaFijada;
    const nuevoEstadoPago = deudaFijada === 0 ? "pagado" : "pendiente_pago";
    await supabase.from("pedidos").update({ anticipo: nuevoAnticipoCalculado, estado_pago: nuevoEstadoPago }).eq("id", id);
    setEditandoDeudaId(null); setNuevoSaldoDeuda(""); mostrarToast("Deuda actualizada"); cargarTodo();
  };

  const subirComprobantePago = async (file: File) => {
    setSubiendoComprobantePago(true);
    const nombreFile = "pago-" + Date.now() + "-" + file.name;
    await supabase.storage.from("productos").upload(nombreFile, file);
    const { data } = supabase.storage.from("productos").getPublicUrl(nombreFile);
    setComprobantePagoParcial(data.publicUrl);
    setSubiendoComprobantePago(false); mostrarToast("Comprobante adjuntado");
  };

  const registrarPagoParcial = async () => {
    if (!pagoParcialModal || !montoPagoParcial) { mostrarToast("Ingresá el monto"); return; }
    const monto = parseInt(montoPagoParcial);
    if (isNaN(monto) || monto <= 0) { mostrarToast("Monto inválido"); return; }
    const deudaActual = pagoParcialModal.total - (pagoParcialModal.anticipo || 0);
    if (monto > deudaActual) { mostrarToast("El monto supera la deuda"); return; }
    const nuevoAnticipo = (pagoParcialModal.anticipo || 0) + monto;
    const nuevoEstado = nuevoAnticipo >= pagoParcialModal.total ? "pagado" : "pendiente_pago";
    await supabase.from("pedidos").update({ anticipo: nuevoAnticipo, estado_pago: nuevoEstado }).eq("id", pagoParcialModal.id);
    await supabase.from("pagos_parciales").insert({
      pedido_id: pagoParcialModal.id, cliente_nombre: pagoParcialModal.cliente_nombre,
      monto, cuenta: cuentaPagoParcial, comprobante_url: comprobantePagoParcial || null,
    });
    mostrarToast("Pago registrado ✓");
    setPagoParcialModal(null); setMontoPagoParcial(""); setCuentaPagoParcial("Efectivo"); setComprobantePagoParcial("");
    cargarTodo();
  };

  const ejecutarRegistroContableManual = async () => {
    if (!movimientoManual.entidad || !movimientoManual.monto) { mostrarToast("Completá los campos obligatorios"); return; }
    const concepto = movimientoManual.concepto || (tipoMovimiento === "ingreso" ? "Pago recibido" : "Compra/Gasto");
    const { error: insertError } = await supabase.from("gastos_distribuidoras").insert({
      distribuidora: movimientoManual.entidad, monto: Number(movimientoManual.monto),
      concepto, cuenta_salida: movimientoManual.cuenta, tipo_movimiento: tipoMovimiento,
      comprobante_url: movimientoManual.comprobanteUrl || null,
    });
    if (insertError) { mostrarToast("Error al guardar"); return; }
    setMovimientoManual({ entidad: "", monto: "", concepto: "", cuenta: "alias", comprobanteUrl: "" });
    mostrarToast("Movimiento registrado ✓"); cargarTodo();
  };

  const subirFotoComprobante = async (file: File) => {
    setSubiendoComprobante(true);
    const nombreFile = "comprobante-" + Date.now() + "-" + file.name;
    await supabase.storage.from("productos").upload(nombreFile, file);
    const { data } = supabase.storage.from("productos").getPublicUrl(nombreFile);
    setMovimientoManual(prev => ({ ...prev, comprobanteUrl: data.publicUrl }));
    setSubiendoComprobante(false); mostrarToast("Comprobante adjuntado");
  };

  const clientesUnicos = Array.from(
    new Map(pedidos.map(p => [p.cliente_nombre, { nombre: p.cliente_nombre, telefono: p.cliente_telefono, direccion: p.cliente_direccion }])).values()
  );
  const pedidosFiltrados = pedidos.filter(p => filtroMes === "Todos" ? true : p.creado_en?.startsWith(filtroMes));
  const pedidosActivos = pedidosFiltrados.filter(p => !(p.aprobado && p.estado_pago === "pagado" && p.estado_entrega === "entregado"));
  const productosFiltrados = productos.filter(p =>
    busquedaCatalogo.trim() === "" ? true :
    p.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busquedaCatalogo.toLowerCase())
  );
  const productosFiltradosVenta = productos.filter(p =>
    categoriaFiltroVenta === "" ? true : p.categoria === categoriaFiltroVenta
  );
  const historialFiltrado = historialUnificado.filter(h => {
    const pasaCuenta = filtroHistorialCuenta === "todas" ? true :
      (filtroHistorialCuenta === "alias" && h.cuenta.toLowerCase().includes("alias")) ||
      (filtroHistorialCuenta === "brubank" && h.cuenta.toLowerCase().includes("brubank")) ||
      (filtroHistorialCuenta === "efectivo" && h.cuenta.toLowerCase().includes("efectivo"));
    const pasaTipo = filtroHistorialTipo === "todos" ? true :
      filtroHistorialTipo === "ingreso" ? h.esIngreso : !h.esIngreso;
    return pasaCuenta && pasaTipo;
  });
  const totalHistorialFiltrado = historialFiltrado.reduce((acc, h) => h.esIngreso ? acc + h.monto : acc - h.monto, 0);
  const deudores = pedidos.filter(p => {
    const deuda = p.total - (p.anticipo || 0);
    return deuda > 0 && !(p.aprobado && p.estado_pago === "pagado" && p.estado_entrega === "entregado");
  });
  const totalPorCobrar = deudores.reduce((acc, p) => acc + (p.total - (p.anticipo || 0)), 0);

  if (!logueado) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 16 }}>
      <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 20, padding: 30, width: "100%", maxWidth: 320, textAlign: "center" }}>
        <h2 style={{ ...neon, fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Panel Admin</h2>
        <input type="password" placeholder="Clave secreta" value={clave}
          onChange={e => setClave(e.target.value)} onKeyDown={e => e.key === "Enter" && login()}
          style={{ ...inputStyle, marginBottom: 12, border: "1px solid #ff2d78", textAlign: "center" }} />
        {errorLogin && <div style={{ color: "#ff2d78", fontSize: 13, marginBottom: 12 }}>{errorLogin}</div>}
        <button onClick={login} style={buttonStyle}>Entrar</button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "sans-serif", color: "#fff", padding: "12px 12px 80px 12px", boxSizing: "border-box" }}>

      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#ff2d78", color: "#fff", padding: "10px 20px", borderRadius: 10, fontWeight: 700, zIndex: 9999, fontSize: 13 }}>
          {toast}
        </div>
      )}

      {pagoParcialModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={() => setPagoParcialModal(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} />
          <div style={{ position: "relative", background: "#111", border: "2px solid #10B981", borderRadius: 20, padding: 24, width: "100%", maxWidth: 380 }}>
            <h3 style={{ color: "#10B981", fontWeight: 900, fontSize: 17, marginBottom: 6 }}>💰 Registrar Pago</h3>
            <p style={{ color: "#aaa", fontSize: 13, marginBottom: 4 }}>{pagoParcialModal.cliente_nombre}</p>
            <p style={{ color: "#F59E0B", fontSize: 13, marginBottom: 16 }}>Deuda actual: {fmt(pagoParcialModal.total - (pagoParcialModal.anticipo || 0))}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Monto que paga ahora ($)</div>
                <input value={montoPagoParcial} onChange={e => setMontoPagoParcial(e.target.value)} placeholder="Ej: 40000" type="number" style={{ ...inputStyle, border: "1px solid #10B981" }} />
              </div>
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Cuenta donde ingresa</div>
                <select value={cuentaPagoParcial} onChange={e => setCuentaPagoParcial(e.target.value)} style={inputStyle}>
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Alias: CARITO.SHOP">📱 Alias CARITO.SHOP</option>
                  <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">👩 Brubank Señora</option>
                </select>
              </div>
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>📎 Adjuntar comprobante (opcional)</div>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && subirComprobantePago(e.target.files[0])} style={{ color: "#aaa", fontSize: 11 }} />
                {subiendoComprobantePago && <div style={{ color: "#ff2d78", fontSize: 11, marginTop: 4 }}>Subiendo...</div>}
                {comprobantePagoParcial && <div style={{ color: "#10B981", fontSize: 11, marginTop: 4 }}>✅ Comprobante listo</div>}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button onClick={() => { setPagoParcialModal(null); setMontoPagoParcial(""); setComprobantePagoParcial(""); }}
                  style={{ flex: 1, padding: 12, background: "#222", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                <button onClick={registrarPagoParcial}
                  style={{ flex: 2, padding: 12, background: "linear-gradient(135deg, #10B981, #059669)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer" }}>Confirmar Pago</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={() => setConfirmarEliminar(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)" }} />
          <div style={{ position: "relative", background: "#111", border: "2px solid #EF4444", borderRadius: 20, padding: 28, width: "100%", maxWidth: 340, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ color: "#EF4444", fontWeight: 900, fontSize: 18, marginBottom: 10 }}>Eliminar producto</h3>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 6 }}>Estás por eliminar:</p>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{confirmarEliminar.nombre}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => eliminarProducto(confirmarEliminar.id)}
                style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #EF4444, #B91C1C)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, cursor: "pointer" }}>Sí, eliminar</button>
              <button onClick={() => setConfirmarEliminar(null)}
                style={{ width: "100%", padding: 12, background: "#222", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
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
          <button onClick={() => setPestana("catalogo")} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === "catalogo" ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>📦 Catalogo</button>
          <button onClick={() => setPestana("alta")} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, background: pestana === "alta" ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>✨ Nuevo Producto</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <button onClick={() => setPestana("cargar_venta")} style={{ padding: 12, borderRadius: 10, border: "1px dashed #ff2d78", fontWeight: 800, fontSize: 11, background: pestana === "cargar_venta" ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>📝 Cargar Venta</button>
          <button onClick={() => setPestana("ventas")} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11, background: pestana === "ventas" ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>📈 Ordenes ({pedidosActivos.length})</button>
          <button onClick={() => setPestana("caja")} style={{ padding: 12, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11, background: pestana === "caja" ? "#ff2d78" : "#111", color: "#fff", cursor: "pointer" }}>💰 Caja</button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {pestana === "cargar_venta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px dashed #ff2d78" }}>
              <h2 style={{ fontSize: 15, margin: "0 0 12px 0", ...neon }}>👤 Datos del Cliente</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ position: "relative" }}>
                  <input value={ventaCliente.nombre}
                    onChange={e => {
                      setVentaCliente(p => ({ ...p, nombre: e.target.value }));
                      const q = e.target.value.toLowerCase();
                      setSugerenciasCliente(q.length > 1 ? clientesUnicos.filter(c => c.nombre.toLowerCase().includes(q)) : []);
                      setMostrarSugerencias(true);
                    }}
                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                    placeholder="Nombre y Apellido *" style={inputStyle} />
                  {mostrarSugerencias && sugerenciasCliente.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1a1a1a", border: "1px solid #ff2d78", borderRadius: 10, zIndex: 100, overflow: "hidden" }}>
                      {sugerenciasCliente.map((c, i) => (
                        <div key={i} onClick={() => { setVentaCliente(c); setMostrarSugerencias(false); }}
                          style={{ padding: "10px 14px", fontSize: 13, color: "#fff", cursor: "pointer", borderBottom: "1px solid #222" }}>
                          <div style={{ fontWeight: 700 }}>{c.nombre}</div>
                          <div style={{ fontSize: 11, color: "#888" }}>{c.telefono} {c.direccion ? "· " + c.direccion : ""}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input value={ventaCliente.telefono} onChange={e => setVentaCliente(p => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono" style={inputStyle} />
                  <input value={ventaCliente.direccion} onChange={e => setVentaCliente(p => ({ ...p, direccion: e.target.value }))} placeholder="Dirección" style={inputStyle} />
                </div>
              </div>
            </div>

            <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #333" }}>
              <h2 style={{ fontSize: 15, margin: "0 0 12px 0", color: "#fff" }}>🛍️ Agregar Productos</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ color: "#ff2d78", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>1. Filtrar por Categoría</div>
                  <select value={categoriaFiltroVenta} onChange={e => { setCategoriaFiltroVenta(e.target.value); setProductoSeleccionado(""); }} style={{ ...inputStyle, border: "1px solid #ff2d78" }}>
                    <option value="">-- Todas las Categorías --</option>
                    {listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>2. Seleccionar Producto</div>
                  <select value={productoSeleccionado} onChange={e => setProductoSeleccionado(e.target.value)} style={inputStyle}>
                    <option value="">-- Elegí un producto --</option>
                    {productosFiltradosVenta.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} (${(p.precio_oferta || p.precio).toLocaleString("es-AR")} - Stock: {p.stock})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ color: "#ff2d78", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>3. Cantidad</div>
                  <input value={cantidadSeleccionada} onChange={e => setCantidadSeleccionada(e.target.value)} placeholder="1" type="number" min="1" style={{ ...inputStyle, border: "1px solid #ff2d78" }} />
                </div>
                <button onClick={agregarAlCarritoVenta} style={{ ...buttonStyle, background: "linear-gradient(135deg, #1D4ED8, #1e40af)" }}>
                  + Agregar al Pedido
                </button>
              </div>
            </div>

            {carritoVenta.length > 0 && (
              <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #ff2d78" }}>
                <h2 style={{ fontSize: 15, margin: "0 0 12px 0", ...neon }}>🧾 Resumen del Pedido</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {carritoVenta.map(item => (
                    <div key={item.productoId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#0a0a0a", borderRadius: 10, border: "1px solid #222" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{item.nombre}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>x{item.cantidad} × {fmt(item.precio)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#ff2d78" }}>{fmt(item.precio * item.cantidad)}</span>
                        <button onClick={() => quitarDelCarritoVenta(item.productoId)} style={{ background: "#7F1D1D", border: "none", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid #ff2d78", paddingTop: 10, display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>TOTAL:</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: "#ff2d78" }}>{fmt(totalCarritoVenta)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0a0a0a", padding: 12, borderRadius: 10, border: "1px solid #222" }}>
                    <input type="checkbox" id="drop2" checked={esDropshippingVenta} onChange={e => setEsDropshippingVenta(e.target.checked)} style={{ transform: "scale(1.3)" }} />
                    <label htmlFor="drop2" style={{ fontSize: 13, color: "#ccc" }}>Es Dropshipping</label>
                  </div>
                  <div>
                    <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Forma de Pago</div>
                    <select value={tipoPagoVenta} onChange={e => setTipoPagoVenta(e.target.value)} style={inputStyle}>
                      <option value="Efectivo">💵 Efectivo</option>
                      <option value="Alias: CARITO.SHOP">📱 Alias: CARITO.SHOP</option>
                      <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">👩 Brubank Señora</option>
                      <option value="Cuotas">📈 Financiar en 3 Cuotas</option>
                    </select>
                  </div>
                  {tipoPagoVenta !== "Cuotas" && (
                    <div>
                      <div style={{ color: "#ff2d78", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Monto Entregado / Seña ($)</div>
                      <input value={montoEntregadoVenta} onChange={e => setMontoEntregadoVenta(e.target.value)} placeholder="Vacío = debe el total" type="number" style={{ ...inputStyle, border: "1px solid #ff2d78" }} />
                    </div>
                  )}
                  <button onClick={ejecutarCargaVentaManual} style={buttonStyle}>✅ Registrar Venta</button>
                </div>
              </div>
            )}
          </div>
        )}

        {pestana === "catalogo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="text" value={busquedaCatalogo} onChange={e => setBusquedaCatalogo(e.target.value)} placeholder="Buscar producto por nombre..." style={inputStyle} />
            {busquedaCatalogo.trim() === "" ? (
              <>
                {(() => {
                  const ahora = new Date();
                  const ofertasActivas = productos.filter(p => p.precio_oferta && p.oferta_hasta && new Date(p.oferta_hasta) > ahora);
                  return ofertasActivas.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", background: "#111", borderRadius: 14, overflow: "hidden", border: "2px dashed #ff2d78" }}>
                      <button type="button" onClick={() => setCategoriaAbierta(prev => prev === "__oferta__" ? null : "__oferta__")}
                        style={{ width: "100%", padding: "16px 14px", background: categoriaAbierta === "__oferta__" ? "#1c0510" : "#111", border: "none", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "#ff2d78" }}>⚡ Oferta Relámpago Activas ({ofertasActivas.length})</span>
                        <span style={{ fontSize: 12, color: "#ff2d78", fontWeight: "bold" }}>{categoriaAbierta === "__oferta__" ? "▲ CERRAR" : "▼ EXPANDIR"}</span>
                      </button>
                      {categoriaAbierta === "__oferta__" && (
                        <div style={{ padding: 10, background: "#0a0a0a", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #333" }}>
                          {ofertasActivas.map(p => <TarjetaProducto key={p.id} p={p} onVer={() => setVistaProductoCompleto(p)} onEditar={() => setEditando(p)} onEliminar={() => setConfirmarEliminar(p)} onToggleActivo={() => toggleActivo(p.id, p.activo)} onStock={(c) => actualizarStock(p.id, p.stock, c)} />)}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
                {listadoCategorias.map(cat => {
                  const prods = productos.filter(p => p.categoria === cat.Nombre);
                  const abierta = categoriaAbierta === cat.Nombre;
                  return (
                    <div key={cat.id} style={{ display: "flex", flexDirection: "column", background: "#111", borderRadius: 14, overflow: "hidden", border: "1px solid #222" }}>
                      <button type="button" onClick={() => setCategoriaAbierta(abierta ? null : cat.Nombre)}
                        style={{ width: "100%", padding: "16px 14px", background: abierta ? "#1c0510" : "#111", border: "none", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: abierta ? "#ff2d78" : "#fff" }}>📁 {cat.Nombre} <span style={{ color: "#555", fontSize: 12, fontWeight: 400 }}>({prods.length})</span></span>
                        <span style={{ fontSize: 12, color: "#ff2d78", fontWeight: "bold" }}>{abierta ? "▲ CERRAR" : "▼ EXPANDIR"}</span>
                      </button>
                      {abierta && (
                        <div style={{ padding: 10, background: "#0a0a0a", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #222" }}>
                          {prods.map(p => <TarjetaProducto key={p.id} p={p} onVer={() => setVistaProductoCompleto(p)} onEditar={() => setEditando(p)} onEliminar={() => setConfirmarEliminar(p)} onToggleActivo={() => toggleActivo(p.id, p.activo)} onStock={(c) => actualizarStock(p.id, p.stock, c)} />)}
                          {prods.length === 0 && <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 10 }}>No hay productos en esta categoría.</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {productosFiltrados.map(p => <TarjetaProducto key={p.id} p={p} onVer={() => setVistaProductoCompleto(p)} onEditar={() => setEditando(p)} onEliminar={() => setConfirmarEliminar(p)} onToggleActivo={() => toggleActivo(p.id, p.activo)} onStock={(c) => actualizarStock(p.id, p.stock, c)} />)}
                {productosFiltrados.length === 0 && <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 20 }}>No se encontraron productos.</div>}
              </div>
            )}
          </div>
        )}

        {pestana === "alta" && (
          <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #ff2d78" }}>
            <h2 style={{ fontSize: 16, margin: "0 0 16px 0", ...neon }}>Nuevo Producto</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={nuevo.nombre} onChange={e => { setNuevo(p => ({ ...p, nombre: e.target.value })); setCoincidenciasAlta(productos.filter(p => p.nombre.toLowerCase().includes(e.target.value.toLowerCase()))); }} placeholder="Nombre del producto" style={inputStyle} />
              {coincidenciasAlta.length > 0 && nuevo.nombre.length > 1 && (
                <div style={{ background: "#1a0a10", border: "1px solid #ff2d78", borderRadius: 10, padding: 8 }}>
                  <div style={{ color: "#ff2d78", fontSize: 11, marginBottom: 4 }}>⚠️ Productos similares:</div>
                  {coincidenciasAlta.slice(0, 3).map(p => <div key={p.id} style={{ fontSize: 12, color: "#aaa", padding: "2px 0" }}>• {p.nombre}</div>)}
                </div>
              )}
              <input value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} placeholder="Precio" type="number" style={inputStyle} />
              <input value={nuevo.precio_oferta} onChange={e => setNuevo(p => ({ ...p, precio_oferta: e.target.value }))} placeholder="Precio oferta (opcional)" type="number" style={inputStyle} />
              <select value={creandoNuevaCat ? "NUEVA" : nuevo.categoria} onChange={e => { if (e.target.value === "NUEVA") setCreandoNuevaCat(true); else { setCreandoNuevaCat(false); setNuevo(p => ({ ...p, categoria: e.target.value })); } }} style={inputStyle}>
                {listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}
                <option value="NUEVA">+ Crear nueva categoría</option>
              </select>
              {creandoNuevaCat && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={nuevaCatNombre} onChange={e => setNuevaCatNombre(e.target.value)} placeholder="Nombre de nueva categoría" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={ejecutarCrearCategoria} style={{ padding: "0 16px", background: "#ff2d78", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>OK</button>
                </div>
              )}
              <input value={nuevo.stock} onChange={e => setNuevo(p => ({ ...p, stock: e.target.value }))} placeholder="Stock inicial" type="number" style={inputStyle} />
              <input value={nuevo.descripcion} onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción (opcional)" style={inputStyle} />
              <div>
                <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Foto principal</div>
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && subirFoto(e.target.files[0], "imagen")} style={{ color: "#fff", fontSize: 12 }} />
                {nuevo.imagen && <img src={nuevo.imagen} style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />}
              </div>
              <button onClick={agregar} style={buttonStyle} disabled={subiendo}>{subiendo ? "Subiendo..." : "Publicar Producto"}</button>
            </div>
          </div>
        )}

        {pestana === "ventas" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Ordenes Activas</span>
              <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "6px 10px" }}>
                <option value="Todos">Todos</option>
                {mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {pedidosActivos.length === 0 && <div style={{ color: "#444", textAlign: "center", padding: 30 }}>No hay órdenes activas</div>}
            {(() => {
              const clientesAgrupados = Array.from(new Map(pedidosActivos.map(p => [p.cliente_nombre, p])).keys());
              return clientesAgrupados.map(nombreCliente => {
                const pedidosCliente = pedidosActivos.filter(p => p.cliente_nombre === nombreCliente);
                const deudaTotalCliente = pedidosCliente.reduce((acc, p) => acc + Math.max(0, p.total - (p.anticipo || 0)), 0);
                const primerPedido = pedidosCliente[0];
                return (
                  <div key={nombreCliente} style={{ background: "#111", borderRadius: 16, marginBottom: 14, border: deudaTotalCliente > 0 ? "1px solid #F59E0B" : "1px solid #222", overflow: "hidden" }}>
                    <div style={{ background: "#0a0a0a", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #222" }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 15, color: "#fff" }}>👤 {nombreCliente}</div>
                        {primerPedido.cliente_telefono && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>📞 {primerPedido.cliente_telefono}</div>}
                      </div>
                      {deudaTotalCliente > 0 && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#888" }}>Deuda total</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: "#F59E0B" }}>{fmt(deudaTotalCliente)}</div>
                        </div>
                      )}
                    </div>

                    {pedidosCliente.map(pedido => {
                      const deuda = pedido.total - (pedido.anticipo || 0);
                      return (
                        <div key={pedido.id} style={{ padding: 14, borderBottom: "1px solid #1a1a1a" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: "#555" }}>📅 {pedido.creado_en?.substring(0, 10)}</span>
                            {pedido.es_dropshipping && <span style={{ fontSize: 10, color: "#8B5CF6" }}>🚚 Dropshipping</span>}
                          </div>
                          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 6 }}>{pedido.productos}</div>
                          <div style={{ fontSize: 13, color: "#ff2d78", fontWeight: 700, marginBottom: 4 }}>Total: {fmt(pedido.total)}</div>
                          {deuda > 0 && <div style={{ fontSize: 12, color: "#F59E0B", marginBottom: 6 }}>⚠️ Debe: {fmt(deuda)}</div>}

                          {editandoClienteId === pedido.id ? (
                            <div style={{ background: "#0a0a0a", borderRadius: 10, padding: 10, marginBottom: 8, border: "1px solid #ff2d78", display: "flex", flexDirection: "column", gap: 8 }}>
                              <input value={editandoClienteData.nombre} onChange={e => setEditandoClienteData(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" style={{ ...inputStyle, padding: 8, fontSize: 12 }} />
                              <input value={editandoClienteData.telefono} onChange={e => setEditandoClienteData(p => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono" style={{ ...inputStyle, padding: 8, fontSize: 12 }} />
                              <input value={editandoClienteData.direccion} onChange={e => setEditandoClienteData(p => ({ ...p, direccion: e.target.value }))} placeholder="Dirección" style={{ ...inputStyle, padding: 8, fontSize: 12 }} />
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={async () => {
                                  await supabase.from("pedidos").update({ cliente_nombre: editandoClienteData.nombre, cliente_telefono: editandoClienteData.telefono, cliente_direccion: editandoClienteData.direccion }).eq("id", pedido.id);
                                  setEditandoClienteId(null); mostrarToast("Cliente actualizado"); cargarTodo();
                                }} style={{ flex: 2, padding: 8, background: "#ff2d78", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>💾 Guardar</button>
                                <button onClick={() => setEditandoClienteId(null)} style={{ flex: 1, padding: 8, background: "#333", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setEditandoClienteId(pedido.id); setEditandoClienteData({ nombre: pedido.cliente_nombre, telefono: pedido.cliente_telefono, direccion: pedido.cliente_direccion }); }}
                              style={{ marginBottom: 6, padding: "5px 10px", background: "#1a1a1a", border: "1px solid #444", borderRadius: 8, color: "#aaa", fontSize: 11, cursor: "pointer" }}>
                              ✏️ Editar datos cliente
                            </button>
                          )}

                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                            <select value={pedido.estado_pago} onChange={e => cambiarEstadoPago(pedido.id, e.target.value)} style={{ ...inputStyle, width: "auto", padding: "6px 8px", fontSize: 11 }}>
                              <option value="pagado">✅ Pagado</option>
                              <option value="pendiente_pago">⏳ Pendiente</option>
                            </select>
                            <select value={pedido.estado_entrega} onChange={e => cambiarEstadoEntrega(pedido.id, e.target.value)} style={{ ...inputStyle, width: "auto", padding: "6px 8px", fontSize: 11 }}>
                              <option value="pendiente_entrega">📦 Pendiente</option>
                              <option value="entregado">✅ Entregado</option>
                            </select>
                            <select value={pedido.cuenta_ingreso} onChange={e => cambiarCuentaIngreso(pedido.id, e.target.value)} style={{ ...inputStyle, width: "auto", padding: "6px 8px", fontSize: 11 }}>
                              <option value="Efectivo">💵 Efectivo</option>
                              <option value="Alias: CARITO.SHOP">📱 Alias</option>
                              <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">👩 Brubank</option>
                            </select>
                          </div>
                          {!pedido.aprobado && (
                            <button onClick={() => ejecutarConfirmacionEntregaReal(pedido)} style={{ ...buttonStyle, marginTop: 8, fontSize: 12, padding: 10 }}>
                              ✅ Confirmar Entrega
                            </button>
                          )}
                          {deuda > 0 && (
                            <button onClick={() => { setPagoParcialModal(pedido); setMontoPagoParcial(""); setComprobantePagoParcial(""); }}
                              style={{ width: "100%", marginTop: 8, padding: 10, background: "linear-gradient(135deg, #10B981, #059669)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                              💰 Registrar Pago Parcial
                            </button>
                          )}
                          {editandoDeudaId === pedido.id ? (
                            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                              <input value={nuevoSaldoDeuda} onChange={e => setNuevoSaldoDeuda(e.target.value)} placeholder="Nueva deuda" type="number" style={{ ...inputStyle, flex: 1, padding: 8 }} />
                              <button onClick={() => guardarModificacionDeudaManual(pedido.id, pedido.total)} style={{ padding: "0 12px", background: "#ff2d78", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>OK</button>
                              <button onClick={() => setEditandoDeudaId(null)} style={{ padding: "0 10px", background: "#333", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" }}>✕</button>
                            </div>
                          ) : (
                            deuda > 0 && <button onClick={() => { setEditandoDeudaId(pedido.id); setNuevoSaldoDeuda(String(deuda)); }} style={{ marginTop: 6, padding: "6px 12px", background: "#1a1a1a", border: "1px solid #F59E0B", borderRadius: 8, color: "#F59E0B", fontSize: 11, cursor: "pointer" }}>✏️ Editar deuda</button>
                          )}
                        </div>
                      );
                    })}

                    {deudaTotalCliente > 0 && (
                      <div style={{ padding: "10px 14px", background: "#0a0a0a" }}>
                        <button onClick={() => {
                          const productosTexto = pedidosCliente.map(p => {
                            const d = p.total - (p.anticipo || 0);
                            const estado = p.estado_entrega === "entregado" ? "✅" : "📦";
                            return `${estado} ${p.productos} — ${fmt(p.total)}${d > 0 ? ` (Debe: ${fmt(d)})` : " (Pagado)"}`;
                          }).join("\n");
                          const msg = `📦 *CARITO.SHOP*\n━━━━━━━━━━━━━━\nHola ${nombreCliente} 👋\n\nTe recordamos que tenés saldos pendientes:\n\n${productosTexto}\n\n⚠️ *Deuda total: ${fmt(deudaTotalCliente)}*\n\nPor favor realizá la transferencia a:\n📱 Alias: CARITO.SHOP\n\n¡Muchas gracias! 🌸\n━━━━━━━━━━━━━━\nCARITO.SHOP - Tu tienda favorita`;
                          window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
                        }} style={{ width: "100%", padding: 10, background: "transparent", border: "1px solid #25D366", borderRadius: 10, color: "#25D366", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          📲 Recordatorio completo por WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {pestana === "caja" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#111", border: "1px solid #F59E0B", borderRadius: 16, padding: 16 }}>
              <h3 style={{ color: "#F59E0B", margin: "0 0 14px 0", fontSize: 15 }}>💳 Saldos por Cobrar</h3>
              {deudores.length === 0 && <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 10 }}>No hay deudas pendientes 🎉</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(() => {
                  const deudoresPorCliente = new Map<string, number>();
                  deudores.forEach(p => {
                    const deuda = p.total - (p.anticipo || 0);
                    deudoresPorCliente.set(p.cliente_nombre, (deudoresPorCliente.get(p.cliente_nombre) || 0) + deuda);
                  });
                  return Array.from(deudoresPorCliente.entries()).map(([nombre, deudaTotal]) => (
                    <div key={nombre} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#0a0a0a", borderRadius: 10, border: "1px solid #2a1f00" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{nombre}</div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#F59E0B", flexShrink: 0, marginLeft: 8 }}>{"$" + deudaTotal.toLocaleString("es-AR")}</span>
                    </div>
                  ));
                })()}
              </div>
              {deudores.length > 0 && (
                <div style={{ borderTop: "1px solid #2a1f00", paddingTop: 10, marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>TOTAL POR COBRAR:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#F59E0B" }}>{"$" + totalPorCobrar.toLocaleString("es-AR")}</span>
                </div>
              )}
            </div>

            <div style={{ background: "#111", border: "1px solid #ff2d78", borderRadius: 16, padding: 16 }}>
              <h3 style={{ ...neon, margin: "0 0 14px 0", fontSize: 15 }}>Saldos Disponibles</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Efectivo", valor: cajas.efectivo, icono: "💵", clave: "efectivo" },
                  { label: "Alias CARITO.SHOP", valor: cajas.alias, icono: "📱", clave: "alias" },
                  { label: "Brubank Señora", valor: cajas.brubankSenora, icono: "👩", clave: "brubank" },
                ].map(({ label, valor, icono, clave }) => (
                  <div key={clave} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#0a0a0a", borderRadius: 10, border: "1px solid #1a1a1a" }}>
                    <span style={{ fontSize: 14, color: "#ccc" }}>{icono} {label}:</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: valor >= 0 ? "#fff" : "#EF4444" }}>{fmt(valor)}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #222", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>TOTAL GENERAL:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, ...neon }}>{fmt(cajas.alias + cajas.brubankSenora + cajas.efectivo)}</span>
                </div>
              </div>
            </div>

            <div style={{ background: "#111", border: "1px solid #333", borderRadius: 16, padding: 16 }}>
              <h3 style={{ color: "#fff", margin: "0 0 14px 0", fontSize: 15 }}>Registrar Movimiento</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
                <button onClick={() => setTipoMovimiento("ingreso")}
                  style={{ padding: 12, borderRadius: 10, border: "2px solid " + (tipoMovimiento === "ingreso" ? "#10B981" : "#222"), background: tipoMovimiento === "ingreso" ? "#052e16" : "#0a0a0a", color: tipoMovimiento === "ingreso" ? "#10B981" : "#555", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  ↑ INGRESO
                </button>
                <button onClick={() => setTipoMovimiento("egreso")}
                  style={{ padding: 12, borderRadius: 10, border: "2px solid " + (tipoMovimiento === "egreso" ? "#EF4444" : "#222"), background: tipoMovimiento === "egreso" ? "#2d0a0a" : "#0a0a0a", color: tipoMovimiento === "egreso" ? "#EF4444" : "#555", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  ↓ EGRESO
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>{tipoMovimiento === "ingreso" ? "Origen / De quién" : "Destino / A quién"}</div>
                  <input value={movimientoManual.entidad} onChange={e => setMovimientoManual(p => ({ ...p, entidad: e.target.value }))}
                    placeholder={tipoMovimiento === "ingreso" ? "Ej: Cliente, Inversor..." : "Ej: Distribuidora, Proveedor..."} style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Monto ($)</div>
                    <input value={movimientoManual.monto} onChange={e => setMovimientoManual(p => ({ ...p, monto: e.target.value }))} placeholder="0" type="number"
                      style={{ ...inputStyle, border: tipoMovimiento === "ingreso" ? "1px solid #10B981" : "1px solid #EF4444" }} />
                  </div>
                  <div>
                    <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Cuenta</div>
                    <select value={movimientoManual.cuenta} onChange={e => setMovimientoManual(p => ({ ...p, cuenta: e.target.value }))} style={inputStyle}>
                      <option value="alias">📱 Alias CARITO.SHOP</option>
                      <option value="Brubank Señora (DIARIO.ITALIA.ARENA)">👩 Brubank Señora</option>
                      <option value="efectivo">💵 Efectivo</option>
                    </select>
                  </div>

                </div>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>Concepto (opcional)</div>
                  <input value={movimientoManual.concepto} onChange={e => setMovimientoManual(p => ({ ...p, concepto: e.target.value }))} placeholder="Ej: Compra stock, Pago seña, etc." style={inputStyle} />
                </div>
                <div style={{ background: "#0a0a0a", borderRadius: 10, padding: 10, border: "1px dashed #333" }}>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>📎 Adjuntar comprobante (opcional)</div>
                  <input type="file" accept="image/*,application/pdf" onChange={e => e.target.files?.[0] && subirFotoComprobante(e.target.files[0])} style={{ color: "#aaa", fontSize: 11 }} />
                  {subiendoComprobante && <div style={{ color: "#ff2d78", fontSize: 11, marginTop: 4 }}>Subiendo...</div>}
                  {movimientoManual.comprobanteUrl && (
                    <div style={{ marginTop: 6 }}>
                      <a href={movimientoManual.comprobanteUrl} target="_blank" rel="noreferrer" style={{ color: "#10B981", fontSize: 11, textDecoration: "none" }}>✅ Comprobante adjuntado - Ver</a>
                    </div>
                  )}
                </div>
                <button onClick={ejecutarRegistroContableManual}
                  style={{ ...buttonStyle, background: tipoMovimiento === "ingreso" ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #EF4444, #B91C1C)" }}>
                  {tipoMovimiento === "ingreso" ? "↑ Registrar Ingreso" : "↓ Registrar Egreso"}
                </button>
              </div>
            </div>

            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: 16 }}>
              <h3 style={{ color: "#fff", margin: "0 0 12px 0", fontSize: 15 }}>📋 Historial de Movimientos</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <select value={filtroHistorialCuenta} onChange={e => setFiltroHistorialCuenta(e.target.value)} style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }}>
                  <option value="todas">Todas las cuentas</option>
                  <option value="alias">📱 Alias</option>
                  <option value="brubank">👩 Brubank</option>
                  <option value="efectivo">💵 Efectivo</option>
                </select>
                <select value={filtroHistorialTipo} onChange={e => setFiltroHistorialTipo(e.target.value)} style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }}>
                  <option value="todos">Todos</option>
                  <option value="ingreso">↑ Solo ingresos</option>
                  <option value="egreso">↓ Solo egresos</option>
                </select>
              </div>
              <div style={{ background: "#0a0a0a", borderRadius: 10, padding: "8px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>{historialFiltrado.length} movimientos</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: totalHistorialFiltrado >= 0 ? "#10B981" : "#EF4444" }}>
                  {totalHistorialFiltrado >= 0 ? "+" : ""}{fmt(totalHistorialFiltrado)}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto" }}>
                {historialFiltrado.length === 0 && <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 20 }}>No hay movimientos con ese filtro</div>}
                {historialFiltrado.map((h, i) => (
                  <div key={i} style={{ background: "#0a0a0a", borderRadius: 10, padding: "10px 12px", border: "1px solid " + (h.esIngreso ? "#0d3321" : "#2d0a0a"), display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{h.esIngreso ? "↑" : "↓"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.entidad}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: h.esIngreso ? "#10B981" : "#EF4444", flexShrink: 0, marginLeft: 6 }}>
                          {h.esIngreso ? "+" : "-"}{fmt(h.monto)}
                        </span>
                      </div>
                      {h.concepto && <div style={{ fontSize: 11, color: "#888", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.concepto}</div>}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "#555" }}>{h.cuenta}</span>
                        <span style={{ fontSize: 10, color: "#444" }}>•</span>
                        <span style={{ fontSize: 10, color: "#444" }}>{h.fecha?.substring(0, 10)}</span>
                        {h.comprobanteUrl && <a href={h.comprobanteUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#ff2d78", textDecoration: "none" }}>📎 Ver</a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {editando && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
          <div style={{ background: "#111", width: "100%", maxWidth: 420, borderRadius: 20, padding: 20, maxHeight: "90vh", overflowY: "auto", border: "1px solid #ff2d78" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ ...neon, fontWeight: 800, fontSize: 16 }}>Editar Producto</span>
              <button onClick={() => setEditando(null)} style={{ background: "none", border: "none", color: "#888", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {editando.imagen && <img src={editando.imagen} style={{ width: "100%", height: 160, objectFit: "contain", borderRadius: 10, marginBottom: 12, background: "#0a0a0a" }} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })} style={inputStyle} placeholder="Nombre" />
              <input value={editando.descripcion || ""} onChange={e => setEditando({ ...editando, descripcion: e.target.value })} style={inputStyle} placeholder="Descripción" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input value={editando.precio} onChange={e => setEditando({ ...editando, precio: Number(e.target.value) })} type="number" style={inputStyle} placeholder="Precio" />
                <input value={editando.precio_oferta || ""} onChange={e => setEditando({ ...editando, precio_oferta: e.target.value ? Number(e.target.value) : null })} type="number" style={inputStyle} placeholder="Precio oferta" />
              </div>
              <input value={editando.stock} onChange={e => setEditando({ ...editando, stock: Number(e.target.value) })} type="number" style={inputStyle} placeholder="Stock" />
              <select value={editando.categoria} onChange={e => setEditando({ ...editando, categoria: e.target.value })} style={inputStyle}>
                {listadoCategorias.map(cat => <option key={cat.id} value={cat.Nombre}>{cat.Nombre}</option>)}
              </select>
              <div style={{ color: "#888", fontSize: 11 }}>Cambiar foto principal:</div>
              <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && subirFoto(e.target.files[0], "imagen")} style={{ color: "#fff", fontSize: 12 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                <button onClick={() => toggleActivo(editando.id, editando.activo)} style={{ padding: 10, background: editando.activo ? "#374151" : "#10B981", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                  {editando.activo ? "⛔ Ocultar" : "✅ Activar"}
                </button>
                <button onClick={() => setConfirmarEliminar(editando)} style={{ padding: 10, background: "#7F1D1D", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>🗑️ Eliminar</button>
              </div>
              <button onClick={guardarEdicion} style={buttonStyle}>💾 Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

function TarjetaProducto({ p, onVer, onEditar, onEliminar, onToggleActivo, onStock }: {
  p: Producto; onVer: () => void; onEditar: () => void; onEliminar: () => void; onToggleActivo: () => void; onStock: (cambio: number) => void;
}) {
  return (
    <div style={{ background: "#111", borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "center", border: "1px solid #222" }}>
      <div onClick={onVer} style={{ width: 45, height: 45, borderRadius: 8, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", cursor: "pointer", border: "1px dashed #ff2d78" }}>
        {p.imagen ? <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>{p.emoji}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
        <div style={{ fontSize: 12, color: "#ff2d78", fontWeight: 800 }}>${(p.precio_oferta || p.precio).toLocaleString("es-AR")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          <button type="button" onClick={() => onStock(-1)} style={{ background: "#222", border: "1px solid #333", color: "#fff", width: 24, height: 24, borderRadius: 4, cursor: "pointer" }}>-</button>
          <span style={{ fontSize: 12, color: "#aaa" }}>Stock: {p.stock}</span>
          <button type="button" onClick={() => onStock(1)} style={{ background: "#222", border: "1px solid #333", color: "#fff", width: 24, height: 24, borderRadius: 4, cursor: "pointer" }}>+</button>
          <button type="button" onClick={onToggleActivo} style={{ padding: "2px 8px", background: p.activo ? "#10B981" : "#374151", border: "none", color: "#fff", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
            {p.activo ? "Activo" : "Inactivo"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <button type="button" onClick={onEditar} style={{ padding: "6px 10px", background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Editar</button>
        <button type="button" onClick={onEliminar} style={{ padding: "6px 10px", background: "#7F1D1D", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🗑️ Borrar</button>
      </div>
    </div>
  );
}