<?php
// ============================================================
//  VELVET BEAUTY — API: /api/productos
//  GET    /api/productos          → lista con filtros
//  GET    /api/productos/{id}     → detalle
//  POST   /api/productos          → crear   [admin]
//  PUT    /api/productos/{id}     → editar  [admin]
//  DELETE /api/productos/{id}     → eliminar [admin]
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

// ── GET ──────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id !== null) {
        // Producto individual
        $stmt = $pdo->prepare('
            SELECT p.*, c.nombre AS categoria, c.slug AS categoria_slug,
                   m.nombre AS marca_nombre, m.slug AS marca_slug
            FROM productos p
            JOIN categorias c ON c.id = p.categoria_id
            JOIN marcas m     ON m.id = p.marca_id
            WHERE p.id = ? AND p.activo = 1
        ');
        $stmt->execute([$id]);
        $prod = $stmt->fetch();
        if (!$prod) jsonError('Producto no encontrado', 404);

        // Decodificar JSON columns
        $prod['etiquetas'] = json_decode($prod['etiquetas'] ?? '[]');
        $prod['imagenes']  = json_decode($prod['imagenes']  ?? '[]');

        // Reseñas recientes
        $r = $pdo->prepare('SELECT * FROM resenas WHERE producto_id = ? AND verificada = 1 ORDER BY creado_en DESC LIMIT 5');
        $r->execute([$id]);
        $prod['resenas'] = $r->fetchAll();

        jsonResponse($prod);
    }

    // Lista con filtros
    $params = $_GET;
    $where  = ['p.activo = 1'];
    $binds  = [];

    if (!empty($params['categoria'])) {
        $where[] = 'c.slug = ?';
        $binds[] = sanitize($params['categoria']);
    }
    if (!empty($params['marca'])) {
        $where[] = 'm.slug = ?';
        $binds[] = sanitize($params['marca']);
    }
    if (!empty($params['q'])) {
        $where[] = '(p.nombre LIKE ? OR m.nombre LIKE ? OR p.descripcion LIKE ?)';
        $q = '%' . sanitize($params['q']) . '%';
        $binds = array_merge($binds, [$q, $q, $q]);
    }
    if (!empty($params['precio_max'])) {
        $where[] = 'p.precio <= ?';
        $binds[] = (float)$params['precio_max'];
    }
    if (!empty($params['precio_min'])) {
        $where[] = 'p.precio >= ?';
        $binds[] = (float)$params['precio_min'];
    }
    if (isset($params['destacado']) && $params['destacado'] === '1') {
        $where[] = 'p.destacado = 1';
    }
    if (!empty($params['etiqueta'])) {
        $where[] = "JSON_CONTAINS(p.etiquetas, ?)";
        $binds[] = json_encode($params['etiqueta']);
    }

    $orderMap = [
        'precio_asc'  => 'p.precio ASC',
        'precio_desc' => 'p.precio DESC',
        'nombre'      => 'p.nombre ASC',
        'rating'      => 'p.calificacion DESC',
        'nuevo'       => 'p.creado_en DESC',
        'default'     => 'p.destacado DESC, p.calificacion DESC',
    ];
    $order = $orderMap[$params['orden'] ?? 'default'] ?? $orderMap['default'];

    $pg = paginate($params);
    $whereSQL = implode(' AND ', $where);

    // Total
    $cnt = $pdo->prepare("SELECT COUNT(*) FROM productos p JOIN categorias c ON c.id=p.categoria_id JOIN marcas m ON m.id=p.marca_id WHERE {$whereSQL}");
    $cnt->execute($binds);
    $total = (int)$cnt->fetchColumn();

    // Resultados
    $stmt = $pdo->prepare("
        SELECT p.id, p.nombre, p.slug, p.precio, p.precio_original, p.stock,
               p.imagen, p.etiquetas, p.calificacion, p.num_resenas, p.destacado,
               c.nombre AS categoria, c.slug AS categoria_slug,
               m.nombre AS marca_nombre, m.slug AS marca_slug
        FROM productos p
        JOIN categorias c ON c.id = p.categoria_id
        JOIN marcas m     ON m.id = p.marca_id
        WHERE {$whereSQL}
        ORDER BY {$order}
        LIMIT {$pg['limit']} OFFSET {$pg['offset']}
    ");
    $stmt->execute($binds);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['etiquetas'] = json_decode($r['etiquetas'] ?? '[]');
    }

    jsonResponse([
        'data'       => $rows,
        'total'      => $total,
        'pagina'     => $pg['page'],
        'por_pagina' => $pg['limit'],
        'paginas'    => (int)ceil($total / $pg['limit']),
    ]);
}

// ── POST ─────────────────────────────────────────────────────
if ($method === 'POST') {
    requireAdmin();
    $b = getBody();

    $required = ['categoria_id','marca_id','nombre','precio','stock'];
    foreach ($required as $f) {
        if (empty($b[$f])) jsonError("Campo requerido: {$f}");
    }

    $slug = slugify($b['nombre']);
    // Garantizar slug único
    $check = $pdo->prepare('SELECT COUNT(*) FROM productos WHERE slug = ?');
    $check->execute([$slug]);
    if ((int)$check->fetchColumn() > 0) $slug .= '-' . time();

    $stmt = $pdo->prepare('
        INSERT INTO productos
            (categoria_id, marca_id, nombre, slug, descripcion, precio, precio_original,
             stock, imagen, ingredientes, tipo_piel, etiquetas, destacado)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ');
    $stmt->execute([
        (int)$b['categoria_id'],
        (int)$b['marca_id'],
        sanitize($b['nombre']),
        $slug,
        sanitize($b['descripcion'] ?? ''),
        (float)$b['precio'],
        isset($b['precio_original']) ? (float)$b['precio_original'] : null,
        (int)$b['stock'],
        sanitize($b['imagen'] ?? ''),
        sanitize($b['ingredientes'] ?? ''),
        sanitize($b['tipo_piel'] ?? ''),
        json_encode($b['etiquetas'] ?? []),
        (int)($b['destacado'] ?? 0),
    ]);

    jsonSuccess(['id' => $pdo->lastInsertId()], 'Producto creado');
}

// ── PUT ──────────────────────────────────────────────────────
if ($method === 'PUT') {
    requireAdmin();
    if (!$id) jsonError('ID requerido');
    $b = getBody();

    $fields = [];
    $binds  = [];

    $updatable = ['nombre','descripcion','precio','precio_original','stock',
                  'imagen','ingredientes','tipo_piel','destacado','activo','categoria_id','marca_id'];

    foreach ($updatable as $f) {
        if (!array_key_exists($f, $b)) continue;
        $fields[] = "{$f} = ?";
        $binds[]  = in_array($f, ['precio','precio_original']) ? (float)$b[$f] :
                    (in_array($f, ['stock','destacado','activo','categoria_id','marca_id']) ? (int)$b[$f] :
                    sanitize((string)$b[$f]));
    }
    if (isset($b['etiquetas'])) {
        $fields[] = 'etiquetas = ?';
        $binds[]  = json_encode($b['etiquetas']);
    }
    if (empty($fields)) jsonError('Nada que actualizar');

    $binds[] = $id;
    $pdo->prepare('UPDATE productos SET ' . implode(', ', $fields) . ' WHERE id = ?')
        ->execute($binds);

    jsonSuccess(null, 'Producto actualizado');
}

// ── DELETE ───────────────────────────────────────────────────
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) jsonError('ID requerido');
    // Soft delete
    $pdo->prepare('UPDATE productos SET activo = 0 WHERE id = ?')->execute([$id]);
    jsonSuccess(null, 'Producto eliminado');
}
