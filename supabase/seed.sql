-- CARITO.SHOP — datos de ejemplo (opcional)
-- Ejecutar DESPUÉS de schema.sql si querés arrancar con productos de ejemplo para probar.
-- Si ya cargaste productos reales desde el panel admin, no hace falta correr este archivo.

insert into products (id, titulo, categoria, descripcion, caracteristicas, precio, precio_oferta, oferta_hasta, imagen, stock, stock_minimo, variantes, garantia_meses, sku, status, vendidos, creado_en, likes, guardados, compartidos, vistas) values
('p1','iPhone 15 128GB','Celulares','iPhone 15 con chip A16 Bionic, cámara dual de 48MP y pantalla Super Retina XDR de 6.1". Ideal para fotografía y rendimiento todo el día.',
 '["Chip A16 Bionic","Cámara 48MP","Pantalla 6.1\" OLED","USB-C"]', 1450000, 1290000, now() + interval '30 hours',
 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=800&q=80', 14, 5,
 '[{"id":"v1","nombre":"128GB - Negro","stock":8},{"id":"v2","nombre":"128GB - Azul","stock":6}]', 12, 'CEL-IP15-128','activo',37, now() - interval '20 days', 128,42,19,980),

('p2','Notebook Lenovo IdeaPad 15.6"','Notebooks','Notebook ideal para trabajo y estudio. Intel Core i5, 16GB RAM, 512GB SSD. Rápida, liviana y con batería de larga duración.',
 '["Intel Core i5","16GB RAM","512GB SSD","Pantalla 15.6\" FHD"]', 980000, null, null,
 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80', 3, 4, null, 12, 'NB-LEN-IP156','activo',21, now() - interval '45 days', 64,31,8,512),

('p3','Auriculares Sony WH-1000XM5','Audio','Auriculares inalámbricos con la mejor cancelación de ruido del mercado. 30hs de batería y sonido de altísima fidelidad.',
 '["Cancelación de ruido líder","30hs de batería","Bluetooth 5.2","Multipunto"]', 420000, 359000, now() + interval '6 hours',
 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80', 22, 5,
 '[{"id":"v1","nombre":"Negro","stock":12},{"id":"v2","nombre":"Plata","stock":10}]', 12, 'AUD-SNY-XM5','activo',58, now() - interval '10 days', 210,77,34,1420),

('p4','PlayStation 5 Slim','Gaming','Consola de última generación con SSD ultra rápido, gráficos en 4K y control DualSense con feedback háptico.',
 '["1TB SSD","4K a 120fps","DualSense incluido","Retrocompatible"]', 1150000, null, null,
 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80', 2, 3, null, 12, 'GAM-PS5-SLIM','activo',44, now() - interval '60 days', 301,120,51,2100),

('p5','Smartwatch Xiaomi Watch S3','Accesorios','Reloj inteligente con GPS, monitor de oxígeno y ritmo cardíaco, y hasta 15 días de batería. Resistente al agua.',
 '["GPS integrado","15 días de batería","Resistente al agua 5ATM","+150 modos deportivos"]', 180000, null, null,
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 31, 8, null, 6, 'ACC-XIA-WS3','activo',15, now() - interval '5 days', 45,18,4,340),

('p6','Smart TV Samsung 55" 4K','Televisores','Televisor 4K UHD con HDR, Tizen OS y Google Assistant integrado. Imagen nítida y colores vibrantes.',
 '["4K UHD HDR10+","Tizen Smart TV","3x HDMI 2.1","Google Assistant"]', 890000, 799000, now() + interval '50 hours',
 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80', 6, 3, null, 24, 'TV-SAM-55-4K','activo',9, now() - interval '15 days', 88,40,12,610),

('p7','Parlante JBL Charge 5','Audio','Parlante portátil resistente al agua (IP67) con 20hs de batería y sonido potente para cualquier lugar.',
 '["IP67 sumergible","20hs de batería","Power Bank integrado","Bluetooth 5.1"]', 260000, null, null,
 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80', 0, 5, null, 12, 'AUD-JBL-CH5','agotado',63, now() - interval '80 days', 156,60,22,900),

('p8','Cámara de seguridad WiFi 360°','Smart Home','Cámara inteligente con visión nocturna, detección de movimiento y monitoreo en vivo desde el celular.',
 '["Visión 360°","Visión nocturna","Detección de movimiento","App gratuita"]', 65000, null, null,
 'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=800&q=80', 40, 10, null, 6, 'HOME-CAM-360','activo',27, now() - interval '3 days', 33,14,3,280)
on conflict (id) do nothing;

insert into customers (id, nombre, telefono, email, total_comprado, cantidad_pedidos, deuda, ultima_compra, es_recurrente, score_interes, productos_guardados, productos_likeados) values
('c1','Martina Gómez','+54 9 11 5555-0101','martina@example.com',1450000,3,0, now() - interval '4 days', true, 82, '["p2","p6"]', '["p1","p2","p6","p3"]'),
('c2','Facundo Álvarez','+54 9 11 5555-0102',null,359000,1,120000, now() - interval '12 days', false, 65, '["p4"]', '["p4","p3"]'),
('c3','Rocío Fernández','+54 9 11 5555-0103','rocio@example.com',2600000,6,0, now() - interval '1 days', true, 91, '["p1"]', '["p1","p5","p8"]'),
('c4','Nicolás Torres','+54 9 11 5555-0104',null,0,0,0, null, false, 88, '["p4","p6","p1"]', '["p4","p6","p1","p3","p2"]')
on conflict (id) do nothing;

insert into orders (id, cliente, items, total, entrega, direccion, metodo_pago, status, creado_en, notas) values
('o1001','{"nombre":"Martina Gómez","telefono":"+54 9 11 5555-0101"}',
 '[{"productId":"p3","titulo":"Auriculares Sony WH-1000XM5","variante":"Negro","cantidad":1,"precioUnitario":359000,"imagen":"https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80"}]',
 359000,'envio','Av. Corrientes 1234, CABA','mercadopago','en_camino', now() - interval '1 days', null),
('o1000','{"nombre":"Facundo Álvarez","telefono":"+54 9 11 5555-0102"}',
 '[{"productId":"p4","titulo":"PlayStation 5 Slim","cantidad":1,"precioUnitario":1150000,"imagen":"https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80"}]',
 1150000,'retiro',null,'transferencia','pendiente', now(), 'Cliente con saldo pendiente de compra anterior'),
('o0999','{"nombre":"Rocío Fernández","telefono":"+54 9 11 5555-0103"}',
 '[{"productId":"p1","titulo":"iPhone 15 128GB","variante":"128GB - Azul","cantidad":1,"precioUnitario":1290000,"imagen":"https://images.unsplash.com/photo-1592286927505-1def25115558?w=800&q=80"}]',
 1290000,'envio','Av. Rivadavia 5000, CABA','mercadopago','entregado', now() - interval '3 days', null)
on conflict (id) do nothing;

insert into coupons (id, codigo, tipo, valor, activo, usos_actuales) values
('cp1','BIENVENIDO10','porcentaje',10,true,34),
('cp2','ENVIOGRATIS','monto_fijo',8000,true,12)
on conflict (id) do nothing;

-- Engagement de ejemplo (likes/guardados iniciales de la clienta demo c4, opcional)
insert into engagement (device_id, product_id, liked, saved) values
('demo-seed','p1', true, true),
('demo-seed','p4', true, true),
('demo-seed','p6', false, true)
on conflict (device_id, product_id) do nothing;
