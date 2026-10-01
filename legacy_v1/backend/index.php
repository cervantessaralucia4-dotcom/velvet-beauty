<?php
// ============================================================
//  VELVET BEAUTY — Router principal
//  Archivo de entrada: /backend/index.php
//  Todas las peticiones llegan aquí vía .htaccess / Render
// ============================================================

declare(strict_types=1);

// Cargar variables de entorno desde .env (si existe)
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (str_contains($line, '=')) {
            [$key, $val] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($val);
        }
    }
}

// Zona horaria
date_default_timezone_set($_ENV['TZ'] ?? 'America/Bogota');

require_once __DIR__ . '/config/helpers.php';

// CORS pre-flight global
setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Parsear ruta  /api/productos/1  →  ['productos', '1']
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim(str_replace('/api', '', $uri), '/');
$parts  = array_values(array_filter(explode('/', $uri)));
$route  = $parts[0] ?? '';

// Inyectar PATH_INFO para que los endpoints puedan leer el segmento ID
$_SERVER['PATH_INFO'] = '/' . implode('/', $parts);

$endpoints = [
    'productos'  => __DIR__ . '/api/productos.php',
    'pedidos'    => __DIR__ . '/api/pedidos.php',
    'cupones'    => __DIR__ . '/api/cupones.php',
    'auth'       => __DIR__ . '/api/auth.php',
    'upload'     => __DIR__ . '/api/upload.php',
    'stats'      => __DIR__ . '/api/stats.php',
    'marcas'     => __DIR__ . '/api/marcas.php',
    'categorias' => __DIR__ . '/api/categorias.php',
];

if (isset($endpoints[$route])) {
    require $endpoints[$route];
} else {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode([
        'error'    => 'Endpoint no encontrado',
        'ruta'     => $uri,
        'version'  => '1.0.0',
        'proyecto' => 'Velvet Beauty API',
    ]);
}
