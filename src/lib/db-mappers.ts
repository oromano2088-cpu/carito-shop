import { Product, Customer, Order, Coupon, TargetedOffer, AIReport } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function rowToProduct(r: any): Product {
  return {
    id: r.id,
    titulo: r.titulo,
    categoria: r.categoria,
    descripcion: r.descripcion,
    caracteristicas: r.caracteristicas ?? [],
    precio: Number(r.precio),
    precioOferta: r.precio_oferta != null ? Number(r.precio_oferta) : undefined,
    ofertaHasta: r.oferta_hasta ?? undefined,
    imagen: r.imagen,
    imagenes: r.imagenes ?? undefined,
    stock: r.stock,
    stockMinimo: r.stock_minimo,
    variantes: r.variantes ?? undefined,
    garantiaMeses: r.garantia_meses,
    sku: r.sku,
    status: r.status,
    vendidos: r.vendidos,
    creadoEn: r.creado_en,
    likes: r.likes,
    guardados: r.guardados,
    compartidos: r.compartidos,
    vistas: r.vistas,
  };
}

export function productToRow(p: Partial<Product>) {
  const row: Record<string, any> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.titulo !== undefined) row.titulo = p.titulo;
  if (p.categoria !== undefined) row.categoria = p.categoria;
  if (p.descripcion !== undefined) row.descripcion = p.descripcion;
  if (p.caracteristicas !== undefined) row.caracteristicas = p.caracteristicas;
  if (p.precio !== undefined) row.precio = p.precio;
  if (p.precioOferta !== undefined) row.precio_oferta = p.precioOferta;
  if (p.ofertaHasta !== undefined) row.oferta_hasta = p.ofertaHasta;
  if (p.imagen !== undefined) row.imagen = p.imagen;
  if (p.imagenes !== undefined) row.imagenes = p.imagenes;
  if (p.stock !== undefined) row.stock = p.stock;
  if (p.stockMinimo !== undefined) row.stock_minimo = p.stockMinimo;
  if (p.variantes !== undefined) row.variantes = p.variantes;
  if (p.garantiaMeses !== undefined) row.garantia_meses = p.garantiaMeses;
  if (p.sku !== undefined) row.sku = p.sku;
  if (p.status !== undefined) row.status = p.status;
  if (p.vendidos !== undefined) row.vendidos = p.vendidos;
  if (p.creadoEn !== undefined) row.creado_en = p.creadoEn;
  if (p.likes !== undefined) row.likes = p.likes;
  if (p.guardados !== undefined) row.guardados = p.guardados;
  if (p.compartidos !== undefined) row.compartidos = p.compartidos;
  if (p.vistas !== undefined) row.vistas = p.vistas;
  return row;
}

export function rowToCustomer(r: any): Customer {
  return {
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono,
    email: r.email ?? undefined,
    totalComprado: Number(r.total_comprado),
    cantidadPedidos: r.cantidad_pedidos,
    deuda: Number(r.deuda),
    ultimaCompra: r.ultima_compra ?? undefined,
    esRecurrente: r.es_recurrente,
    scoreInteres: r.score_interes,
    productosGuardados: r.productos_guardados ?? [],
    productosLikeados: r.productos_likeados ?? [],
  };
}

export function customerToRow(c: Partial<Customer>) {
  const row: Record<string, any> = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.nombre !== undefined) row.nombre = c.nombre;
  if (c.telefono !== undefined) row.telefono = c.telefono;
  if (c.email !== undefined) row.email = c.email;
  if (c.totalComprado !== undefined) row.total_comprado = c.totalComprado;
  if (c.cantidadPedidos !== undefined) row.cantidad_pedidos = c.cantidadPedidos;
  if (c.deuda !== undefined) row.deuda = c.deuda;
  if (c.ultimaCompra !== undefined) row.ultima_compra = c.ultimaCompra;
  if (c.esRecurrente !== undefined) row.es_recurrente = c.esRecurrente;
  if (c.scoreInteres !== undefined) row.score_interes = c.scoreInteres;
  if (c.productosGuardados !== undefined) row.productos_guardados = c.productosGuardados;
  if (c.productosLikeados !== undefined) row.productos_likeados = c.productosLikeados;
  return row;
}

export function rowToOrder(r: any): Order {
  return {
    id: r.id,
    cliente: r.cliente,
    items: r.items,
    total: Number(r.total),
    entrega: r.entrega,
    direccion: r.direccion ?? undefined,
    metodoPago: r.metodo_pago,
    status: r.status,
    creadoEn: r.creado_en,
    notas: r.notas ?? undefined,
  };
}

export function orderToRow(o: Order) {
  return {
    id: o.id,
    cliente: o.cliente,
    items: o.items,
    total: o.total,
    entrega: o.entrega,
    direccion: o.direccion ?? null,
    metodo_pago: o.metodoPago,
    status: o.status,
    creado_en: o.creadoEn,
    notas: o.notas ?? null,
  };
}

export function rowToCoupon(r: any): Coupon {
  return {
    id: r.id,
    codigo: r.codigo,
    tipo: r.tipo,
    valor: Number(r.valor),
    activo: r.activo,
    usosMaximos: r.usos_maximos ?? undefined,
    usosActuales: r.usos_actuales,
    vigenteHasta: r.vigente_hasta ?? undefined,
  };
}

export function couponToRow(c: Partial<Coupon>) {
  const row: Record<string, any> = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.codigo !== undefined) row.codigo = c.codigo;
  if (c.tipo !== undefined) row.tipo = c.tipo;
  if (c.valor !== undefined) row.valor = c.valor;
  if (c.activo !== undefined) row.activo = c.activo;
  if (c.usosMaximos !== undefined) row.usos_maximos = c.usosMaximos;
  if (c.usosActuales !== undefined) row.usos_actuales = c.usosActuales;
  if (c.vigenteHasta !== undefined) row.vigente_hasta = c.vigenteHasta;
  return row;
}

export function rowToOffer(r: any): TargetedOffer {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    clienteNombre: r.cliente_nombre,
    productId: r.product_id,
    productTitulo: r.product_titulo,
    motivo: r.motivo,
    descuentoSugerido: r.descuento_sugerido,
    creadoEn: r.creado_en,
    estado: r.estado,
  };
}

export function offerToRow(o: TargetedOffer) {
  return {
    id: o.id,
    cliente_id: o.clienteId,
    cliente_nombre: o.clienteNombre,
    product_id: o.productId,
    product_titulo: o.productTitulo,
    motivo: o.motivo,
    descuento_sugerido: o.descuentoSugerido,
    creado_en: o.creadoEn,
    estado: o.estado,
  };
}

export function rowToReport(r: any): AIReport {
  return {
    id: r.id,
    generadoEn: r.generado_en,
    periodo: r.periodo,
    resumen: r.resumen,
    hallazgos: r.hallazgos ?? [],
    recomendaciones: r.recomendaciones ?? [],
  };
}

export function reportToRow(r: AIReport) {
  return {
    id: r.id,
    generado_en: r.generadoEn,
    periodo: r.periodo,
    resumen: r.resumen,
    hallazgos: r.hallazgos,
    recomendaciones: r.recomendaciones,
  };
}
