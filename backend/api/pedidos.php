<?php
// ============================================================
//  VELVET BEAUTY — API: /api/pedidos
//  POST  /api/pedidos          → crear pedido (público)
//  GET   /api/pedidos          → listar       [admin]
//  GET   /api/pedidos/{id}     → detalle      [admin]
//  PUT   /api/pedidos/{id}     → actualizar estado [admin]
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$pdo    = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];
$path   = $_SERVER['PATH_INFO'] ?? '';
$parts  = array_values(array_filter(explode('/', $path)));
$id     = isset($parts[1]) ? (int)$parts[1] : null;

// ── POST: Crear pedido ────────────────────────────────────────
if ($method === 'POST') {
    $b = getBody();

    // Validación básica
    foreach (['nombre_cliente','telefono','direccion','ciudad','departamento','metodo_pago','items'] as $f) {
        if (empty($b[$f])) jsonError("Campo requerido: {$f}");
    }
    if (!is_array($b['items']) || count($b['items']) === 0) {
        jsonError('El carrito está vacío');
    }

    // Validar stock y calcular subtotal
    $subtotal = 0.0;
    $lineas   = [];

    foreach ($b['items'] as $item) {
        $pid = (int)($item['producto_id'] ?? 0);
        $qty = (int)($item['cantidad']    ?? 0);
        if ($pid <= 0 || $qty <= 0) jsonError('Item inválido');

        $prod = $pdo->prepare('SELECT id, precio, stock, nombre FROM productos WHERE id = ? AND activo = 1');
        $prod->execute([$pid]);
        $row = $prod->fetch();
        if (!$row) jsonError("Producto #{$pid} no encontrado");
        if ($row['stock'] < $qty) jsonError("Sin stock suficiente para: {$row['nombre']}");

        $line = $row['precio'] * $qty;
        $subtotal += $line;
        $lineas[] = ['id' => $pid, 'qty' => $qty, 'precio' => $row['precio'], 'sub' => $line];
    }

    // Cupón
    $cupon_id = null;
    $descuento = 0.0;
    if (!empty($b['cupon_codigo'])) {
        $c = $pdo->prepare('SELECT * FROM cupones WHERE codigo = ? AND activo = 1 AND (fecha_expiracion IS NULL OR fecha_expiracion >= CURDATE()) AND (usos_max IS NULL OR usos_actuales < usos_max)');
        $c->execute([strtoupper(trim($b['cupon_codigo']))]);
        $cupon = $c->fetch();
        if ($cupon) {
            $cupon_id  = $cupon['id'];
            $descuento = $cupon['tipo'] === 'percent'
                ? round($subtotal * $cupon['descuento'] / 100, 2)
                : (float)$cupon['descuento'];
        }
    }

    $total = max(0, $subtotal - $descuento);

    // Generar código VB-XXX
    $last = $pdo->query("SELECT MAX(id) FROM pedidos")->fetchColumn();
    $codigo = 'VB-' . str_pad((string)((int)$last + 1), 3, '0', STR_PAD_LEFT);

    $pdo->beginTransaction();
    try {
        // Insertar pedido
        $ins = $pdo->prepare('
            INSERT INTO pedidos
                (codigo, nombre_cliente, telefono, direccion, ciudad, departamento,
                 metodo_pago, notas, cupon_id, descuento_total, subtotal, total)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        ');
        $ins->execute([
            $codigo,
            sanitize($b['nombre_cliente']),
            sanitize($b['telefono']),
            sanitize($b['direccion']),
            sanitize($b['ciudad']),
            sanitize($b['departamento']),
            sanitize($b['metodo_pago']),
            sanitize($b['notas'] ?? ''),
            $cupon_id,
            $descuento,
            $subtotal,
            $total,
        ]);
        $pedidoId = $pdo->lastInsertId();

        // Insertar detalles y reducir stock
        $detIns = $pdo->prepare('INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unit, subtotal) VALUES (?,?,?,?,?)');
        $stUpd  = $pdo->prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
        foreach ($lineas as $l) {
            $detIns->execute([$pedidoId, $l['id'], $l['qty'], $l['precio'], $l['sub']]);
            $stUpd->execute([$l['qty'], $l['id']]);
        }

        // Incrementar uso del cupón
        if ($cupon_id) {
            $pdo->prepare('UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = ?')->execute([$cupon_id]);
        }

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Error al procesar el pedido: ' . $e->getMessage(), 500);
    }

    jsonSuccess([
        'pedido_id' => $pedidoId,
        'codigo'    => $codigo,
        'total'     => $total,
    ], 'Pedido creado correctamente');
}

// ── GET ──────────────────────────────────────────────────────
if ($method === 'GET') {
    requireAdmin();

    if ($id !== null) {
        // Detalle
        $stmt = $pdo->prepare('SELECT p.*, cu.codigo AS cupon_codigo FROM pedidos p LEFT JOIN cupones cu ON cu.id = p.cupon_id WHERE p.id = ?');
        $stmt->execute([$id]);
        $pedido = $stmt->fetch();
        if (!$pedido) jsonError('Pedido no encontrado', 404);

        // Items
        $items = $pdo->prepare('
            SELECT dp.*, pr.nombre, pr.imagen, m.nombre AS marca
            FROM detalles_pedido dp
            JOIN productos pr ON pr.id = dp.producto_id
            JOIN marcas m     ON m.id  = pr.marca_id
            WHERE dp.pedido_id = ?
        ');
        $items->execute([$id]);
        $pedido['items'] = $items->fetchAll();

        // Comprobante
        $comp = $pdo->prepare('SELECT * FROM comprobantes WHERE pedido_id = ?');
        $comp->execute([$id]);
        $pedido['comprobante'] = $comp->fetch() ?: null;

        jsonResponse($pedido);
    }

    // Lista
    $params = $_GET;
    $where  = ['1=1'];
    $binds  = [];

    if (!empty($params['estado'])) {
        $where[] = 'estado = ?';
        $binds[] = $params['estado'];
    }
    if (!empty($params['q'])) {
        $where[] = '(nombre_cliente LIKE ? OR codigo LIKE ? OR telefono LIKE ?)';
        $q = '%' . sanitize($params['q']) . '%';
        $binds = array_merge($binds, [$q, $q, $q]);
    }

    $pg = paginate($params);
    $whereSQL = implode(' AND ', $where);

    $cnt = $pdo->prepare("SELECT COUNT(*) FROM pedidos WHERE {$whereSQL}");
    $cnt->execute($binds);
    $total = (int)$cnt->fetchColumn();

    $stmt = $pdo->prepare("SELECT * FROM pedidos WHERE {$whereSQL} ORDER BY creado_en DESC LIMIT {$pg['limit']} OFFSET {$pg['offset']}");
    $stmt->execute($binds);

    jsonResponse([
        'data'       => $stmt->fetchAll(),
        'total'      => $total,
        'pagina'     => $pg['page'],
        'por_pagina' => $pg['limit'],
    ]);
}

// ── PUT: Actualizar estado ────────────────────────────────────
if ($method === 'PUT') {
    requireAdmin();
    if (!$id) jsonError('ID requerido');
    $b = getBody();

    $estados = ['pending','confirmed','shipped','delivered','cancelled'];
    if (empty($b['estado']) || !in_array($b['estado'], $estados, true)) {
        jsonError('Estado inválido. Opciones: ' . implode(', ', $estados));
    }

    $pdo->prepare('UPDATE pedidos SET estado = ? WHERE id = ?')->execute([$b['estado'], $id]);
    jsonSuccess(null, 'Estado actualizado');
}
