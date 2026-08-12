export type ProductStatus = "activo" | "pausado" | "agotado";

export interface ProductVariant {
  id: string;
  nombre: string; // e.g. "128GB - Negro"
  stock: number;
  precioExtra?: number;
}

export interface Product {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  caracteristicas: string[];
  precio: number;
  precioOferta?: number;
  ofertaHasta?: string; // ISO date for countdown
  imagen: string;
  imagenes?: string[];
  stock: number;
  stockMinimo: number;
  variantes?: ProductVariant[];
  garantiaMeses: number;
  sku: string;
  status: ProductStatus;
  vendidos: number;
  creadoEn: string;
  // --- Engagement social (estilo Instagram) ---
  likes: number;
  guardados: number;
  compartidos: number;
  vistas: number;
}

/** Interacción de un cliente con un producto: para feed tipo Instagram (like/guardar) */
export interface Engagement {
  clienteId: string;
  productId: string;
  liked: boolean;
  saved: boolean;
  vistoEn: string;
}

/** Oferta personalizada sugerida por el asistente IA para "tentar" a un cliente puntual */
export interface TargetedOffer {
  id: string;
  clienteId: string;
  clienteNombre: string;
  productId: string;
  productTitulo: string;
  motivo: string; // por qué la IA la sugiere, ej: "Le dio like 3 veces y no compró"
  descuentoSugerido: number; // %
  creadoEn: string;
  estado: "sugerida" | "enviada" | "aceptada" | "descartada";
}

/** Reporte generado automáticamente por el asistente IA */
export interface AIReport {
  id: string;
  generadoEn: string;
  periodo: string;
  resumen: string;
  hallazgos: string[];
  recomendaciones: string[];
}

export type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "preparando"
  | "listo_envio"
  | "en_camino"
  | "entregado"
  | "cancelado";

export interface OrderItem {
  productId: string;
  titulo: string;
  variante?: string;
  cantidad: number;
  precioUnitario: number;
  imagen: string;
}

export interface Order {
  id: string;
  cliente: {
    nombre: string;
    telefono: string;
    email?: string;
  };
  items: OrderItem[];
  total: number;
  entrega: "envio" | "retiro";
  direccion?: string;
  metodoPago: "mercadopago" | "transferencia" | "efectivo";
  status: OrderStatus;
  creadoEn: string;
  notas?: string;
}

export interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  totalComprado: number;
  cantidadPedidos: number;
  deuda: number;
  ultimaCompra?: string;
  esRecurrente: boolean;
  // --- Engagement social ---
  productosGuardados: string[]; // ids de productos guardados (wishlist)
  productosLikeados: string[];
  scoreInteres: number; // 0-100, calculado por el asistente IA
}

export interface Coupon {
  id: string;
  codigo: string;
  tipo: "porcentaje" | "monto_fijo";
  valor: number;
  activo: boolean;
  usosMaximos?: number;
  usosActuales: number;
  vigenteHasta?: string;
}

export interface CartLine {
  productId: string;
  varianteId?: string;
  cantidad: number;
}
