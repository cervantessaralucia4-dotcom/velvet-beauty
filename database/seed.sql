-- ============================================================
--  VELVET BEAUTY — Datos iniciales (seed)
-- ============================================================

-- Categorías
INSERT INTO categorias (nombre, slug, descripcion) VALUES
('Makeup',   'makeup',   'Maquillaje de las mejores marcas del mundo'),
('Skincare', 'skincare', 'Cuidado de la piel con ingredientes premium'),
('Haircare', 'haircare', 'Tratamientos y productos capilares profesionales');

-- Marcas
INSERT INTO marcas (nombre, slug) VALUES
('Rare Beauty',         'rare-beauty'),
('Fenty Beauty',        'fenty-beauty'),
('Maybelline',          'maybelline'),
('NYX',                 'nyx'),
('e.l.f.',              'elf'),
('Huda Beauty',         'huda-beauty'),
('CeraVe',              'cerave'),
('La Roche-Posay',      'la-roche-posay'),
('The Ordinary',        'the-ordinary'),
('Beauty of Joseon',    'beauty-of-joseon'),
('COSRX',               'cosrx'),
('Olaplex',             'olaplex'),
('Kérastase',           'kerastase'),
('Moroccanoil',         'moroccanoil'),
('L\'Oréal Professionnel','loreal-professionnel');

-- Cupones
INSERT INTO cupones (codigo, tipo, descuento, usos_max, fecha_expiracion, activo) VALUES
('VELVET10',  'percent', 10.00, 100, '2025-12-31', 1),
('BEAUTY15',  'percent', 15.00,  50, '2025-09-30', 1),
('SKIN20',    'percent', 20.00,  30, '2025-08-31', 1),
('OLAPLEX50', 'fixed',   50000,  20, '2025-07-15', 1);

-- Admin por defecto  (password: admin123 — cambiar en producción)
INSERT INTO administradores (nombre, email, password, rol) VALUES
('Admin Velvet', 'admin@velvetbeauty.co',
 '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uXkMdLsH6', 'superadmin');

-- Productos de ejemplo
INSERT INTO productos
    (categoria_id, marca_id, nombre, slug, descripcion, precio, precio_original,
     stock, ingredientes, tipo_piel, etiquetas, calificacion, num_resenas, destacado)
VALUES
(1, 1, 'Soft Pinch Tinted Lip Oil',
 'soft-pinch-tinted-lip-oil',
 'Aceite de labios que añade color y brillo irresistible. Fórmula hidratante con vitamina E.',
 89000, NULL, 48,
 'Vitamina E, Aceite de jojoba, Castor oil',
 'Todos los tipos', '["Bestseller"]', 4.90, 1240, 1),

(2, 2, 'Fenty Skin Butta Drop',
 'fenty-skin-butta-drop',
 'Crema corporal con aceite de moringa y manteca de karité. Hidratación 72 horas.',
 145000, 175000, 22,
 'Moringa oil, Shea butter, Hyaluronic acid',
 'Piel seca a mixta', '["Sale"]', 4.80, 890, 1),

(2, 9, 'Niacinamide 10% + Zinc 1%',
 'niacinamide-10-zinc-1',
 'Serum de alta concentración que reduce poros y controla el sebo. Fórmula clínica.',
 42000, NULL, 85,
 'Niacinamide 10%, Zinc PCA 1%',
 'Piel grasa y mixta', '["Trending"]', 4.70, 5620, 1),

(3, 12, 'Bond No.3 Hair Perfector',
 'bond-no3-hair-perfector',
 'Tratamiento capilar que reconstruye los enlaces del cabello dañado.',
 189000, 220000, 15,
 'Bis-Aminopropyl Diglycol Dimaleate',
 'Cabello dañado', '["Sale"]', 4.90, 3200, 1),

(1, 2, 'Pro Filt''r Soft Matte Foundation',
 'pro-filtr-soft-matte-foundation',
 'Base de larga duración con acabado mate. 50 tonos inclusivos.',
 165000, NULL, 30,
 'SPF 15, Vitamina E',
 'Piel grasa', NULL, 4.70, 2100, 0),

(1, 1, 'Glow Serum Stick',
 'glow-serum-stick',
 'Iluminador en barra para un glow natural. Textura cremosa.',
 95000, NULL, 40,
 'Mica, Vitamina C, Aceite de rosa',
 'Todos los tipos', '["New"]', 4.60, 780, 0),

(2, 10, 'Double Cleansing Foam',
 'double-cleansing-foam',
 'Limpiador facial coreano con centella asiática y almidón de arroz.',
 68000, NULL, 60,
 'Centella Asiatica, Rice starch, Green tea',
 'Piel sensible', '["New"]', 4.80, 1890, 0),

(3, 13, 'Discipline Bain Fluidealiste',
 'discipline-bain-fluidealiste',
 'Champú para cabellos ondulados. Controla frizz y define rizos.',
 210000, 240000, 18,
 'Morpho-keratine, Iris florentina',
 'Cabello rizado', '["Sale"]', 4.80, 650, 0),

(2, 7, 'Bright Eyes Vitamin C Eye Cream',
 'bright-eyes-vitamin-c',
 'Contorno de ojos con vitamina C, ácido hialurónico y ceramidas.',
 78000, NULL, 35,
 'Vitamina C, Hyaluronic acid, Ceramides',
 'Piel sensible', NULL, 4.50, 920, 0),

(1, 4, 'NYX Butter Gloss',
 'nyx-butter-gloss',
 'Brillo de labios ultra hidratante. 30 tonos deliciosos.',
 35000, NULL, 70,
 'Shea butter, Cocoa butter, Vitamin E',
 'Todos los tipos', NULL, 4.60, 3400, 0),

(3, 14, 'Mythical Oil',
 'moroccanoil-mythical-oil',
 'El aceite capilar original con argán marroquí. Nutre y controla el frizz.',
 155000, 175000, 25,
 'Argan oil, Cyclomethicone, Linseed extract',
 'Todos los tipos de cabello', '["Bestseller"]', 4.90, 4100, 1),

(2, 8, 'Cicaplast Baume B5',
 'cicaplast-baume-b5',
 'Bálsamo multi-reparador con pantenol. Restaura pieles irritadas y sensibles.',
 88000, NULL, 45,
 'Panthenol B5, Madecassoside, Zinc',
 'Piel muy sensible e irritada', '["Trending"]', 4.85, 2800, 1);
