<?php
// ============================================================
//  VELVET BEAUTY — API: /api/stats  [admin]
//  GET /api/stats  → dashboard stats
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
if ($_SERVER['REQUEST_METHOD'] !== 'GET')     jsonError('Método no permitido', 405);

requireAdmin();
$pdo = Database::connect();

// Ventas totales (pedidos confirmados/entregados)
$ventasTotal = $pdo->query("
    SELECT COALESCE(SUM(total),0) FROM pedidos
    WHERE estado IN ('confirmed','shipped','delivered')
")->fetchColumn();

// Ventas este mes
$ventasMes = $pdo->query("
    SELECT COALESCE(SUM(total),0) FROM pedidos
    WHERE estado IN ('confirmed','shipped','delivered')
      AND MONTH(creado_en) = MONTH(NOW()) AND YEAR(creado_en) = YEAR(NOW())
")->fetchColumn();

// Pedidos
$totalPedidos   = $pdo->query("SELECT COUNT(*) FROM pedidos")->fetchColumn();
$pedidosPending = $pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'pending'")->fetchColumn();

// Productos
$totalProductos = $pdo->query("SELECT COUNT(*) FROM productos WHERE activo = 1")->fetchColumn();
$sinStock       = $pdo->query("SELECT COUNT(*) FROM productos WHERE stock = 0 AND activo = 1")->fetchColumn();

// Cupones
$cuponesActivos = $pdo->query("SELECT COUNT(*) FROM cupones WHERE activo = 1")->fetchColumn();
$totalUsos      = $pdo->query("SELECT COALESCE(SUM(usos_actuales),0) FROM cupones")->fetchColumn();

// Ventas por mes (últimos 6 meses)
$ventasPorMes = $pdo->query("
    SELECT DATE_FORMAT(creado_en,'%Y-%m') AS mes,
           COUNT(*) AS pedidos,
           SUM(total) AS ventas
    FROM pedidos
    WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY mes ORDER BY mes ASC
")->fetchAll();

// Top 5 productos más vendidos
$topProductos = $pdo->query("
    SELECT p.nombre, m.nombre AS marca,
           SUM(dp.cantidad) AS unidades,
           SUM(dp.subtotal) AS ingresos
    FROM detalles_pedido dp
    JOIN productos p ON p.id = dp.producto_id
    JOIN marcas    m ON m.id = p.marca_id
    GROUP BY dp.producto_id
    ORDER BY unidades DESC
    LIMIT 5
")->fetchAll();

// Pedidos recientes
$recientes = $pdo->query("
    SELECT id, codigo, nombre_cliente, total, estado, creado_en
    FROM pedidos ORDER BY creado_en DESC LIMIT 8
")->fetchAll();

jsonResponse([
    'ventas_total'    => (float)$ventasTotal,
    'ventas_mes'      => (float)$ventasMes,
    'total_pedidos'   => (int)$totalPedidos,
    'pedidos_pending' => (int)$pedidosPending,
    'total_productos' => (int)$totalProductos,
    'sin_stock'       => (int)$sinStock,
    'cupones_activos' => (int)$cuponesActivos,
    'total_usos_cupones' => (int)$totalUsos,
    'ventas_por_mes'  => $ventasPorMes,
    'top_productos'   => $topProductos,
    'pedidos_recientes' => $recientes,
]);
