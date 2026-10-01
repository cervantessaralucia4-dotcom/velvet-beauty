-- ============================================================
--  VELVET BEAUTY — Schema MySQL
--  Compatible con Aiven (MySQL 8.x)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Categorías
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen      VARCHAR(255),
    activa      TINYINT(1) NOT NULL DEFAULT 1,
    creado_en   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Marcas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marcas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    logo        VARCHAR(255),
    activa      TINYINT(1) NOT NULL DEFAULT 1,
    creado_en   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Productos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categoria_id    INT UNSIGNED NOT NULL,
    marca_id        INT UNSIGNED NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL UNIQUE,
    descripcion     TEXT,
    precio          DECIMAL(12,2) NOT NULL,
    precio_original DECIMAL(12,2) DEFAULT NULL,
    stock           INT UNSIGNED  NOT NULL DEFAULT 0,
    imagen          VARCHAR(255),
    imagenes        JSON          DEFAULT NULL,   -- array de rutas adicionales
    ingredientes    TEXT          DEFAULT NULL,
    tipo_piel       VARCHAR(100)  DEFAULT NULL,
    etiquetas       JSON          DEFAULT NULL,   -- ["New","Bestseller","Trending"]
    calificacion    DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
    num_resenas     INT UNSIGNED  NOT NULL DEFAULT 0,
    destacado       TINYINT(1)   NOT NULL DEFAULT 0,
    activo          TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_cat  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    CONSTRAINT fk_prod_marca FOREIGN KEY (marca_id)    REFERENCES marcas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Cupones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cupones (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo          VARCHAR(50)  NOT NULL UNIQUE,
    tipo            ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
    descuento       DECIMAL(10,2) NOT NULL,
    usos_max        INT UNSIGNED  DEFAULT NULL,   -- NULL = ilimitado
    usos_actuales   INT UNSIGNED  NOT NULL DEFAULT 0,
    fecha_inicio    DATE          DEFAULT NULL,
    fecha_expiracion DATE         DEFAULT NULL,
    activo          TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Pedidos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo          VARCHAR(20)  NOT NULL UNIQUE,  -- VB-001
    nombre_cliente  VARCHAR(150) NOT NULL,
    telefono        VARCHAR(30)  NOT NULL,
    direccion       TEXT         NOT NULL,
    ciudad          VARCHAR(100) NOT NULL,
    departamento    VARCHAR(100) NOT NULL,
    metodo_pago     VARCHAR(50)  NOT NULL,
    notas           TEXT         DEFAULT NULL,
    cupon_id        INT UNSIGNED DEFAULT NULL,
    descuento_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    subtotal        DECIMAL(12,2) NOT NULL,
    total           DECIMAL(12,2) NOT NULL,
    estado          ENUM('pending','confirmed','shipped','delivered','cancelled')
                    NOT NULL DEFAULT 'pending',
    creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_cupon FOREIGN KEY (cupon_id) REFERENCES cupones(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Detalles del pedido
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id   INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    cantidad    INT UNSIGNED NOT NULL,
    precio_unit DECIMAL(12,2) NOT NULL,
    subtotal    DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_det_pedido  FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)  ON DELETE CASCADE,
    CONSTRAINT fk_det_prod    FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Comprobantes de pago
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comprobantes (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id   INT UNSIGNED NOT NULL UNIQUE,
    archivo     VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(10) NOT NULL,  -- jpg, png, pdf
    verificado  TINYINT(1)  NOT NULL DEFAULT 0,
    subido_en   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comp_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Reseñas (opcional)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resenas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    producto_id INT UNSIGNED NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    calificacion TINYINT UNSIGNED NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario  TEXT,
    verificada  TINYINT(1)  NOT NULL DEFAULT 0,
    creado_en   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_prod FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Administradores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS administradores (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,   -- bcrypt hash
    rol         ENUM('superadmin','admin') NOT NULL DEFAULT 'admin',
    activo      TINYINT(1)  NOT NULL DEFAULT 1,
    ultimo_login DATETIME   DEFAULT NULL,
    creado_en   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
