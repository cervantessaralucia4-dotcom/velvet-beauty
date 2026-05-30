# 💄 Velvet Beauty — Tienda Online Premium

Plataforma e-commerce de productos de belleza (Makeup · Skincare · Haircare)  
**Stack:** PHP 8.3 · MySQL 8 · HTML5/CSS3/JS (Vanilla + ES Modules)  
**Deploy:** Render (backend) · Aiven (MySQL) · GitHub Pages o Render (frontend)

---

## Estructura del proyecto

```
velvet_beauty/
├── backend/
│   ├── api/
│   │   ├── productos.php     ← CRUD productos
│   │   ├── pedidos.php       ← Crear y gestionar pedidos
│   │   ├── cupones.php       ← Validar y CRUD cupones
│   │   ├── auth.php          ← Login admin (JWT)
│   │   ├── upload.php        ← Subida de archivos
│   │   ├── stats.php         ← Dashboard stats
│   │   ├── marcas.php
│   │   └── categorias.php
│   ├── config/
│   │   ├── database.php      ← Conexión PDO a MySQL/Aiven
│   │   └── helpers.php       ← CORS, respuestas JSON, utilidades
│   ├── middleware/
│   │   └── auth.php          ← JWT (sin librería externa)
│   ├── index.php             ← Router principal
│   └── .htaccess
├── frontend/
│   ├── js/
│   │   ├── api.js            ← Cliente HTTP para todos los endpoints
│   │   ├── store.js          ← Estado: Carrito, Wishlist, Cupón
│   │   ├── app.js            ← Inicialización y lógica Home
│   │   ├── shop.js           ← Tienda con filtros
│   │   ├── checkout.js       ← Proceso de compra
│   │   └── admin.js          ← Panel de administración
│   └── css/
├── database/
│   ├── schema.sql            ← Tablas MySQL
│   └── seed.sql              ← Datos iniciales
├── uploads/
│   ├── comprobantes/         ← Comprobantes de pago
│   └── productos/            ← Imágenes de productos
├── docker/
│   ├── apache.conf
│   └── php.ini
├── docker-compose.yml        ← Desarrollo local
├── Dockerfile                ← Deploy en Render
├── render.yaml               ← Config Render
├── .env.example              ← Plantilla de variables
└── .gitignore
```

---

## 🖥 Requisitos para correr en tu PC

### Opción A — Con Docker (RECOMENDADA, más fácil)

**Necesitas instalar:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — Incluye Docker + Docker Compose

**Pasos:**
```bash
# 1. Clona o copia el proyecto
cd velvet_beauty

# 2. Levanta todo (PHP + MySQL + phpMyAdmin)
docker-compose up -d

# 3. Espera 20 segundos y abre:
#    Backend API  → http://localhost:8000/api/productos
#    phpMyAdmin   → http://localhost:8080
#    Frontend     → abre frontend/index.html con Live Server (VS Code)
```

---

### Opción B — Sin Docker (manual)

**Necesitas instalar:**

| Herramienta | Versión | Descarga |
|---|---|---|
| PHP | 8.1 o superior | https://www.php.net/downloads |
| MySQL | 8.0 o superior | https://dev.mysql.com/downloads/ |
| Composer | Última | https://getcomposer.org |
| VS Code | Última | https://code.visualstudio.com |
| Extensión Live Server | — | Buscar en VS Code Extensions |

> **Alternativa fácil a PHP + MySQL por separado:** instala [XAMPP](https://www.apachefriends.org/) o [Laragon](https://laragon.org/) (Windows) — incluye Apache, PHP y MySQL en un solo instalador.

**Pasos con XAMPP / Laragon:**
```bash
# 1. Copia la carpeta backend/ a:
#    XAMPP   → C:/xampp/htdocs/velvet_beauty/
#    Laragon → C:/laragon/www/velvet_beauty/

# 2. Abre phpMyAdmin (http://localhost/phpmyadmin)
#    Crea una base de datos llamada: velvet_beauty
#    Importa:  database/schema.sql  →  luego  database/seed.sql

# 3. Crea el archivo backend/.env copiando .env.example:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=velvet_beauty
DB_USER=root
DB_PASS=          # dejar vacío si XAMPP no tiene contraseña

# 4. Abre VS Code, instala la extensión "Live Server"
#    Clic derecho en frontend/index.html → "Open with Live Server"
#    El frontend abre en http://127.0.0.1:5500

# 5. En api.js cambia la URL base:
#    const API_BASE = 'http://localhost/velvet_beauty/api';
```

---

## ☁ Deploy en producción

### Base de datos → Aiven
1. Crea una cuenta en [aiven.io](https://aiven.io) (plan free disponible)
2. Crea un servicio **MySQL**
3. Descarga el certificado CA (`ca.pem`) desde el dashboard
4. Importa `schema.sql` y `seed.sql` usando el cliente MySQL de Aiven o DBeaver
5. Copia las credenciales al `.env`

### Backend → Render
1. Sube el proyecto a GitHub (sin `.env`)
2. Crea una cuenta en [render.com](https://render.com)
3. **New → Web Service → Connect to GitHub repo**
4. Runtime: **Docker**
5. En **Environment Variables** agrega las variables del `.env`
6. Deploy — Render construye el Docker automáticamente

### Frontend → Render Static Site o GitHub Pages
1. En Render: **New → Static Site**
2. Carpeta raíz: `frontend/`
3. En `frontend/js/api.js` cambia `API_BASE` por la URL de tu backend en Render

---

## 🔑 Credenciales por defecto (desarrollo)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@velvetbeauty.co | admin123 |

> Cambia la contraseña en producción usando:
> ```php
> echo password_hash('tu_nueva_clave', PASSWORD_BCRYPT, ['cost' => 12]);
> ```
> Y actualiza el campo `password` en la tabla `administradores`.

---

## 📡 Endpoints de la API

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/productos` | Listar productos (filtros) | No |
| GET | `/api/productos/{id}` | Detalle producto | No |
| POST | `/api/productos` | Crear producto | Admin |
| PUT | `/api/productos/{id}` | Editar producto | Admin |
| DELETE | `/api/productos/{id}` | Eliminar (soft) | Admin |
| POST | `/api/pedidos` | Crear pedido | No |
| GET | `/api/pedidos` | Listar pedidos | Admin |
| PUT | `/api/pedidos/{id}` | Actualizar estado | Admin |
| POST | `/api/cupones/validar` | Validar cupón | No |
| GET | `/api/cupones` | Listar cupones | Admin |
| POST | `/api/auth/login` | Login admin | No |
| GET | `/api/auth/me` | Info admin actual | Admin |
| POST | `/api/upload/comprobante` | Subir comprobante | No |
| GET | `/api/stats` | Dashboard stats | Admin |

---

## 💄 Cupones de prueba

| Código | Descuento |
|---|---|
| VELVET10 | 10% |
| BEAUTY15 | 15% |
| SKIN20   | 20% |

---

## 🛠 Tecnologías usadas

- **PHP 8.3** — Backend sin frameworks (PDO, JWT manual)
- **MySQL 8** — Base de datos relacional
- **JavaScript ES Modules** — Frontend sin frameworks ni bundlers
- **Docker** — Contenedores para desarrollo y producción
- **Render** — Hosting del backend
- **Aiven** — MySQL gestionado en la nube
