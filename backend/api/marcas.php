<?php
// ============================================================
//  VELVET BEAUTY — API: /api/marcas
// ============================================================
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../middleware/auth.php';
setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
$pdo    = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];
$parts  = array_values(array_filter(explode('/', $_SERVER['PATH_INFO'] ?? '')));
$id     = isset($parts[1]) ? (int)$parts[1] : null;

if ($method === 'GET') {
    if ($id) {
        $s = $pdo->prepare('SELECT * FROM marcas WHERE id = ? AND activa = 1');
        $s->execute([$id]);
        $row = $s->fetch();
        if (!$row) jsonError('Marca no encontrada', 404);
        jsonResponse($row);
    }
    jsonResponse($pdo->query('SELECT * FROM marcas WHERE activa = 1 ORDER BY nombre')->fetchAll());
}
if ($method === 'POST') {
    requireAdmin();
    $b = getBody();
    if (empty($b['nombre'])) jsonError('nombre requerido');
    $slug = slugify($b['nombre']);
    $pdo->prepare('INSERT INTO marcas (nombre, slug, descripcion, logo) VALUES (?,?,?,?)')
        ->execute([sanitize($b['nombre']), $slug, sanitize($b['descripcion'] ?? ''), sanitize($b['logo'] ?? '')]);
    jsonSuccess(['id' => $pdo->lastInsertId()], 'Marca creada');
}
if ($method === 'PUT') {
    requireAdmin();
    if (!$id) jsonError('ID requerido');
    $b = getBody();
    $pdo->prepare('UPDATE marcas SET nombre=?, descripcion=?, logo=?, activa=? WHERE id=?')
        ->execute([sanitize($b['nombre'] ?? ''), sanitize($b['descripcion'] ?? ''), sanitize($b['logo'] ?? ''), (int)($b['activa'] ?? 1), $id]);
    jsonSuccess(null, 'Marca actualizada');
}
if ($method === 'DELETE') {
    requireAdmin();
    if (!$id) jsonError('ID requerido');
    $pdo->prepare('UPDATE marcas SET activa = 0 WHERE id = ?')->execute([$id]);
    jsonSuccess(null, 'Marca eliminada');
}
