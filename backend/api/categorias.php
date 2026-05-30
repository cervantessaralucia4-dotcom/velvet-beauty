<?php
// ============================================================
//  VELVET BEAUTY — API: /api/categorias
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
        $s = $pdo->prepare('SELECT * FROM categorias WHERE id = ? AND activa = 1');
        $s->execute([$id]);
        $row = $s->fetch();
        if (!$row) jsonError('Categoría no encontrada', 404);
        jsonResponse($row);
    }
    // Con conteo de productos
    $rows = $pdo->query('
        SELECT c.*, COUNT(p.id) AS total_productos
        FROM categorias c
        LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = 1
        WHERE c.activa = 1
        GROUP BY c.id ORDER BY c.nombre
    ')->fetchAll();
    jsonResponse($rows);
}
if ($method === 'POST') {
    requireAdmin();
    $b = getBody();
    if (empty($b['nombre'])) jsonError('nombre requerido');
    $slug = slugify($b['nombre']);
    $pdo->prepare('INSERT INTO categorias (nombre, slug, descripcion) VALUES (?,?,?)')
        ->execute([sanitize($b['nombre']), $slug, sanitize($b['descripcion'] ?? '')]);
    jsonSuccess(['id' => $pdo->lastInsertId()], 'Categoría creada');
}
if ($method === 'PUT') {
    requireAdmin();
    if (!$id) jsonError('ID requerido');
    $b = getBody();
    $pdo->prepare('UPDATE categorias SET nombre=?, descripcion=?, activa=? WHERE id=?')
        ->execute([sanitize($b['nombre'] ?? ''), sanitize($b['descripcion'] ?? ''), (int)($b['activa'] ?? 1), $id]);
    jsonSuccess(null, 'Categoría actualizada');
}
