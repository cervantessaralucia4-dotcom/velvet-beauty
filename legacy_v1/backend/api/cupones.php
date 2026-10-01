<?php
// ============================================================
//  VELVET BEAUTY — API: /api/cupones
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

// POST /api/cupones/validar  → público
if ($method === 'POST' && ($parts[1] ?? '') === 'validar') {
    $b    = getBody();
    $code = strtoupper(trim($b['codigo'] ?? ''));
    if (!$code) jsonError('Código requerido');

    $stmt = $pdo->prepare('
        SELECT * FROM cupones
        WHERE codigo = ? AND activo = 1
          AND (fecha_inicio IS NULL OR fecha_inicio <= CURDATE())
          AND (fecha_expiracion IS NULL OR fecha_expiracion >= CURDATE())
          AND (usos_max IS NULL OR usos_actuales < usos_max)
    ');
    $stmt->execute([$code]);
    $cupon = $stmt->fetch();

    if (!$cupon) jsonError('Código inválido o expirado', 422);

    jsonSuccess([
        'codigo'    => $cupon['codigo'],
        'tipo'      => $cupon['tipo'],
        'descuento' => (float)$cupon['descuento'],
    ], 'Cupón válido');
}

// GET  → listar [admin]
if ($method === 'GET') {
    requireAdmin();
    $stmt = $pdo->query('SELECT * FROM cupones ORDER BY creado_en DESC');
    jsonResponse($stmt->fetchAll());
}

// POST /api/cupones → crear [admin]
if ($method === 'POST') {
    requireAdmin();
    $b = getBody();
    foreach (['codigo','tipo','descuento'] as $f) {
        if (empty($b[$f])) jsonError("Campo requerido: {$f}");
    }
    $pdo->prepare('INSERT INTO cupones (codigo, tipo, descuento, usos_max, fecha_inicio, fecha_expiracion, activo) VALUES (?,?,?,?,?,?,?)')
        ->execute([
            strtoupper(sanitize($b['codigo'])),
            $b['tipo'],
            (float)$b['descuento'],
            isset($b['usos_max']) ? (int)$b['usos_max'] : null,
            $b['fecha_inicio'] ?? null,
            $b['fecha_expiracion'] ?? null,
            (int)($b['activo'] ?? 1),
        ]);
    jsonSuccess(['id' => $pdo->lastInsertId()], 'Cupón creado');
}

// PUT  → editar [admin]
if ($method === 'PUT') {
    requireAdmin();
    if (!$id) jsonError('ID requerido');
    $b = getBody();
    $pdo->prepare('UPDATE cupones SET activo = ?, fecha_expiracion = ? WHERE id = ?')
        ->execute([(int)($b['activo'] ?? 1), $b['fecha_expiracion'] ?? null, $id]);
    jsonSuccess(null, 'Cupón actualizado');
}

// DELETE → eliminar [admin]
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) jsonError('ID requerido');
    $pdo->prepare('DELETE FROM cupones WHERE id = ?')->execute([$id]);
    jsonSuccess(null, 'Cupón eliminado');
}
